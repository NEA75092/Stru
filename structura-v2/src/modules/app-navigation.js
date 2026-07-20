(function initStructuraNavigation(root, factory) {
  const api = factory(root);
  root.StructuraNavigation = api;
  root.nav = api.nav;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraNavigation(root) {
    function positionNavIndicator(tab) {
      const indicator = document.getElementById("nav-indicator");
      if (!indicator || !tab) return;
      indicator.style.height = `${tab.offsetHeight}px`;
      indicator.style.transform = `translateY(${tab.offsetTop}px)`;
    }

    function tabIndex(viewId) {
      const tabs = document.querySelectorAll(".nav-tab");
      return Array.prototype.findIndex.call(tabs, (t) => t.id === "tab-" + viewId);
    }

    function nav(viewId) {
      if (typeof document === "undefined") return;
      const prevViewId = root.StructuraAppState?.runtime?.currentView;
      const prevIndex = prevViewId ? tabIndex(prevViewId) : -1;
      const nextIndex = tabIndex(viewId);

      document
        .querySelectorAll(".nav-tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".view")
        .forEach((view) => view.classList.remove("active"));

      const activeTab = document.getElementById("tab-" + viewId);
      activeTab?.classList.add("active");
      positionNavIndicator(activeTab);
      const targetView = document.getElementById("view-" + viewId);
      // La vue entre depuis le bas si on descend dans la liste de nav,
      // depuis le haut si on remonte — direction cohérente avec le clic
      // plutôt qu'un même petit glissement générique à chaque fois.
      targetView?.style.setProperty(
        "--view-enter-y",
        nextIndex < prevIndex ? "-14px" : "14px",
      );
      targetView?.classList.add("active");

      if (root.StructuraAppState?.runtime) {
        root.StructuraAppState.runtime.currentView = viewId;
      }

      if (targetView?.scrollTo) {
        targetView.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (viewId === "dashboard") {
        root.renderDashboardSummary?.();
        root.renderAlerts?.();
        root.renderEvents?.();
        root.drawPerfChart?.();
        root.renderDashboardModules?.();
      }
      if (viewId === "portfolio") root.renderPf?.();
      if (viewId === "barriers") root.renderBarriers?.();
      if (viewId === "analytics") root.renderAnalytics?.();
      if (viewId === "calendar") root.renderCalendar?.();
      if (viewId === "clients") root.renderClients?.();
      if (viewId === "screener") root.runScreener?.();
    }

    if (typeof document !== "undefined") {
      // Scripts load with `defer`, so the DOM is already fully parsed
      // by the time this module runs — no need to wait for an event.
      positionNavIndicator(document.querySelector(".nav-tab.active"));
    }

    return { nav, positionNavIndicator };
  },
);
