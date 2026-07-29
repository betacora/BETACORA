"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LoginPrompt } from "@/components/LoginPrompt";
import {
  TravelerProfileCard,
  type TravelerProfileData,
} from "@/components/TravelerProfileCard";
import { ACCOUNT_DELETE_CONFIRM_PHRASE } from "@/lib/accountDelete";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";
import { getLatestTravelerProfile } from "@/lib/itineraries";
import { supabase } from "@/lib/supabase";

export default function PerfilPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading, signOut } = useAuth();
  const [lang, setLang] = useState<AppLang>("es");
  const [profile, setProfile] = useState<TravelerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setLang(detectLang("es"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!isLoggedIn) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const latest = await getLatestTravelerProfile(supabase);
      if (cancelled) return;
      if (latest?.profile_type) {
        setProfile({
          profile_type: latest.profile_type,
          profile_essence: latest.profile_essence,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  const copy = NAV_COPY[lang].perfil;
  const confirmOk =
    confirmText.trim().toUpperCase() === ACCOUNT_DELETE_CONFIRM_PHRASE;

  async function handleDeleteAccount() {
    if (!confirmOk || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setDeleteError(copy.deleteError);
        setDeleting(false);
        return;
      }

      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: ACCOUNT_DELETE_CONFIRM_PHRASE }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setDeleteError(data.error || copy.deleteError);
        setDeleting(false);
        return;
      }

      await signOut();
      router.replace("/?account=deleted");
    } catch {
      setDeleteError(copy.deleteError);
      setDeleting(false);
    }
  }

  function openDeleteModal() {
    setConfirmText("");
    setDeleteError(null);
    setShowDelete(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDelete(false);
    setConfirmText("");
    setDeleteError(null);
  }

  const deleteSection = (
    <div className="mt-10 pt-8 border-t border-[#E5E5E5]">
      <p className="text-[0.65rem] tracking-[0.14em] uppercase text-[#9a9590] font-medium m-0 mb-3 text-center">
        {lang === "en" ? "Danger zone" : lang === "fr" ? "Zone sensible" : "Zona de peligro"}
      </p>
      <button
        type="button"
        onClick={openDeleteModal}
        className="w-full py-3 rounded-[7px] border border-[#E5E5E5] bg-white text-sm font-medium text-[#B42318] cursor-pointer hover:border-[#B42318]/20 hover:bg-[#FFF8F7] transition-colors"
      >
        {copy.deleteAccount}
      </button>
    </div>
  );

  return (
    <>
      <AppHeader title={copy.title} />
      <main className="flex-1 px-4 py-6 sm:px-6 max-w-lg mx-auto w-full">
        {authLoading || (isLoggedIn && loading) ? (
          <p className="text-sm text-[#6B6B6B] text-center py-12 m-0">
            {copy.loading}
          </p>
        ) : !isLoggedIn ? (
          <LoginPrompt
            title={copy.loginTitle}
            body={copy.loginBody}
            cta={copy.loginCta}
            href="/auth?next=/perfil"
          />
        ) : profile ? (
          <div className="flex flex-col gap-4">
            <TravelerProfileCard lang={lang} profile={profile} />
            <Link
              href="/explorar?mode=discover"
              className="w-full text-center py-2.5 text-sm text-[#2D7B7B] no-underline hover:opacity-80"
            >
              {copy.updateProfile}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-3 rounded-[7px] border border-[#E5E5E5] bg-white text-sm font-medium text-[#6B6B6B] cursor-pointer hover:text-[#1A1A1A] transition-colors"
            >
              {copy.logout}
            </button>
            {deleteSection}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-7 text-center">
              <p className="text-lg font-medium text-[#1A1A1A] m-0">
                {copy.emptyTitle}
              </p>
              <Link
                href="/explorar?mode=discover"
                className="mt-6 inline-flex w-full max-w-xs justify-center px-6 py-3 rounded-[7px] bg-[#E8634A] text-white font-medium text-sm no-underline hover:opacity-90"
              >
                {copy.emptyCta}
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="mt-4 w-full py-2.5 text-sm text-[#6B6B6B] bg-transparent border-0 cursor-pointer"
              >
                {copy.logout}
              </button>
            </div>
            {deleteSection}
          </div>
        )}
      </main>

      {showDelete ? (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/35"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-md rounded-[10px] border border-[#E5E5E5] bg-white p-5 sm:p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-account-title"
              className="text-lg font-medium text-[#1A1A1A] m-0 tracking-tight"
            >
              {copy.deleteTitle}
            </h2>
            <p className="mt-3 text-sm text-[#6B6B6B] leading-relaxed m-0">
              {copy.deleteBody}
            </p>
            <ul className="mt-3 text-sm text-[#1A1A1A] leading-relaxed m-0 pl-5 list-disc">
              <li>{copy.deleteListProfile}</li>
              <li>{copy.deleteListTrips}</li>
              <li>{copy.deleteListFlights}</li>
              <li>{copy.deleteListShares}</li>
            </ul>
            <label className="mt-5 block text-sm font-medium text-[#1A1A1A]">
              {copy.deleteConfirmLabel}
              <input
                type="text"
                autoComplete="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-2 w-full box-border px-3 py-2.5 rounded-[7px] border border-[#E5E5E5] text-sm text-[#1A1A1A] bg-white outline-none focus:border-[#B42318]"
                placeholder={copy.deleteConfirmPhrase}
                disabled={deleting}
              />
            </label>
            {deleteError ? (
              <p className="mt-3 text-sm text-[#B42318] m-0">{deleteError}</p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={!confirmOk || deleting}
                onClick={handleDeleteAccount}
                className="w-full py-3 rounded-[7px] bg-[#B42318] text-white text-sm font-medium border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {deleting ? copy.deleteWorking : copy.deleteConfirmCta}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={closeDeleteModal}
                className="w-full py-3 rounded-[7px] border border-[#E5E5E5] bg-white text-sm font-medium text-[#6B6B6B] cursor-pointer hover:text-[#1A1A1A] transition-colors"
              >
                {copy.deleteCancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
