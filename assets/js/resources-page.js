(() => {
  "use strict";

  const root = document.querySelector("[data-resources-page]");
  if (!root) return;

  const searchInput = root.querySelector("[data-resources-search]");
  const clearButton = root.querySelector("[data-resources-clear]");
  const resetButton = root.querySelector("[data-reset-catalog]");
  const status = root.querySelector("[data-results-status]");
  const emptyState = root.querySelector("[data-resources-empty]");
  const filterButtons = Array.from(root.querySelectorAll("[data-category-filter]"));
  const categories = Array.from(root.querySelectorAll("[data-resource-category]"));
  const expandAllButton = root.querySelector("[data-expand-all]");
  const collapseAllButton = root.querySelector("[data-collapse-all]");

  if (!searchInput || !status || categories.length === 0) return;

  const normalizeText = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/\s+/g, " ")
      .trim();

  categories.forEach((category) => {
    category.querySelectorAll("[data-resource-item]").forEach((item) => {
      item.dataset.normalizedText = normalizeText(item.textContent || "");
    });
  });

  let activeCategory = "all";
  const totalItems = categories.reduce(
    (total, category) => total + category.querySelectorAll("[data-resource-item]").length,
    0
  );

  const setActiveFilter = (categoryId) => {
    activeCategory = categoryId;
    filterButtons.forEach((button) => {
      const isActive = button.dataset.categoryFilter === categoryId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  const applyFilters = () => {
    const normalizedQuery = normalizeText(searchInput.value);
    const terms = normalizedQuery ? normalizedQuery.split(" ") : [];
    let visibleItems = 0;
    let visibleCategories = 0;

    categories.forEach((category) => {
      const categoryAllowed =
        activeCategory === "all" || category.dataset.resourceCategory === activeCategory;
      let categoryVisibleItems = 0;

      category.querySelectorAll("[data-resource-item]").forEach((item) => {
        const itemText = item.dataset.normalizedText || "";
        const matchesQuery = terms.every((term) => itemText.includes(term));
        const isVisible = categoryAllowed && matchesQuery;

        item.hidden = !isVisible;
        if (isVisible) categoryVisibleItems += 1;
      });

      const categoryIsVisible = categoryAllowed && categoryVisibleItems > 0;
      category.hidden = !categoryIsVisible;

      if (categoryIsVisible) {
        visibleCategories += 1;
        visibleItems += categoryVisibleItems;
        if (normalizedQuery || activeCategory !== "all") category.open = true;
      }
    });

    const hasFilters = Boolean(normalizedQuery) || activeCategory !== "all";
    clearButton.hidden = !normalizedQuery;
    emptyState.hidden = visibleItems !== 0;

    if (!hasFilters && visibleItems === totalItems) {
      status.textContent = `${totalItems} conteúdos encontrados.`;
    } else {
      const itemLabel = visibleItems === 1 ? "conteúdo encontrado" : "conteúdos encontrados";
      const categoryLabel = visibleCategories === 1 ? "categoria" : "categorias";
      status.textContent = `${visibleItems} ${itemLabel} em ${visibleCategories} ${categoryLabel}.`;
    }
  };

  const resetCatalog = () => {
    searchInput.value = "";
    setActiveFilter("all");
    applyFilters();
    searchInput.focus();
  };

  searchInput.addEventListener("input", applyFilters);

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && searchInput.value) {
      searchInput.value = "";
      applyFilters();
    }
  });

  clearButton?.addEventListener("click", () => {
    searchInput.value = "";
    applyFilters();
    searchInput.focus();
  });

  resetButton?.addEventListener("click", resetCatalog);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveFilter(button.dataset.categoryFilter || "all");
      applyFilters();
    });
  });

  expandAllButton?.addEventListener("click", () => {
    categories.forEach((category) => {
      if (!category.hidden) category.open = true;
    });
  });

  collapseAllButton?.addEventListener("click", () => {
    categories.forEach((category) => {
      if (!category.hidden) category.open = false;
    });
  });

  const openCategoryFromHash = () => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const target = categories.find((category) => category.id === hash);
    if (target) target.open = true;
  };

  window.addEventListener("hashchange", openCategoryFromHash);
  openCategoryFromHash();
  applyFilters();
})();
