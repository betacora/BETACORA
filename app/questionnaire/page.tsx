import { redirect } from "next/navigation";

/** Legacy route — questionnaire now lives under the Explorar tab. */
export default function QuestionnaireRedirect() {
  redirect("/explorar");
}
