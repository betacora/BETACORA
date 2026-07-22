(async function () {
  const mod = await import('/archetypes-core.js');
  window.BTArchetypes = {
    selectArchetype: mod.selectArchetype,
    getModifiers: mod.getModifiers,
    getArchetypeById: mod.getArchetypeById,
  };
  window.dispatchEvent(new Event('bt-archetypes-ready'));
})();
