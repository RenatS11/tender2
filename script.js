document.addEventListener("DOMContentLoaded", () => {
  // Экраны
  const screens = {
    screen1: document.getElementById("screen1"),
    screen2: document.getElementById("screen2"),
    screen3: document.getElementById("screen3"),
    screen4: document.getElementById("screen4"),
  };
  const showScreen = (id) => {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[id].classList.add("active");
  };

  // Кнопки навигации
  document.getElementById("btnLogin1").onclick = () => showScreen("screen2");
  document.getElementById("btnRegister").onclick = () => showScreen("screen3");
  document.getElementById("btnSkip1").onclick = () => showScreen("screen3");
  document.getElementById("btnLogin2").onclick = () => {
    const u = document.getElementById("loginInput").value.trim();
    const p = document.getElementById("passwordInput").value.trim();
    if (!u || !p) return alert("Введите логин и пароль");
    showScreen("screen3");
  };
  document.getElementById("btnSkip2").onclick = () => showScreen("screen3");
  document.getElementById("btnBack2").onclick = () => showScreen("screen1");
  document.getElementById("btnGlobe").onclick = () => {
    renderAll();
    showScreen("screen4");
  };
  document.getElementById("btnHomeFromScreen4").onclick = () => {
    renderUser();
    showScreen("screen3");
  };

  // Модальные окна
  const modal = document.getElementById("modal");
  const filterModal = document.getElementById("filterModal");
  document.getElementById("btnAddTS").onclick = () => openAddModal();
  document.getElementById("btnCancelModal").onclick = () => closeAddModal();
  document.getElementById("btnOpenFilter").onclick = () =>
    filterModal.classList.remove("hidden");
  document.getElementById("btnCancelFilter").onclick = () =>
    filterModal.classList.add("hidden");

  // Формы и списки
  const addForm = document.getElementById("addFlightForm");
  const filterForm = document.getElementById("filterForm");
  const userList = document.getElementById("flightsList");
  const allList = document.getElementById("allFlightsList");

  // Хранилища
  let editingCard = null;
  const userFlights = [];
  const allFlights = [];

  // Инициализация демо-данных
  (function initDemo() {
    const cities = ["Москва", "Казань", "СПб", "Новосиб", "Екатер"];
    const trans = ["ВИС", "ГАЗ", "КАМАЗ"];
    const resp = ["Иванов", "Петров", "Сидоров"];
    const phones = ["+7 111 111 11 11", "+7 222 222 22 22", "+7 333 333 33 33"];
    const rndDate = () => {
      const d =
        new Date(2025, 0, 1).getTime() +
        Math.random() *
          (new Date(2025, 11, 31).getTime() - new Date(2025, 0, 1).getTime());
      return new Date(d).toISOString().split("T")[0];
    };
    for (let i = 0; i < 10; i++) {
      allFlights.push({
        from: cities[i % 5],
        departureDate: rndDate(),
        to: cities[(i + 2) % 5],
        transport: trans[i % 3],
        capacity: (i + 1).toString(),
        responsible: resp[i % 3],
        phone: phones[i % 3],
      });
    }
  })();

  // Утилиты
  const fmtDate = (ds) => {
    const [y, m, d] = ds.split("-");
    return `${d}.${m}.${y.slice(2)}`;
  };

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // Создание/обновление карточки
  function createCard(data, container) {
    const card = document.createElement("div");
    card.className = "flight-card";
    card.dataset.flight = JSON.stringify(data);

    const info = document.createElement("div");
    info.className = "flight-info";
    ["row-1", "row-2", "row-3"].forEach((cls, idx) => {
      const row = document.createElement("div");
      row.className = cls;
      if (idx === 0)
        row.innerHTML = `<span>${data.from}</span><span>${fmtDate(
          data.departureDate
        )}</span>`;
      if (idx === 1)
        row.innerHTML = `<span>${data.to}</span><span>${data.transport}, ${data.capacity} т</span>`;
      if (idx === 2)
        row.innerHTML = `<span>👤${data.responsible}</span><span>📞${data.phone}</span>`;
      info.appendChild(row);
    });
    card.appendChild(info);

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "❌";
    del.onclick = (e) => {
      e.stopPropagation();
      if (!confirm("Удалить рейс?")) return;
      removeFlight(JSON.parse(card.dataset.flight));
      renderUser();
      renderAll();
    };
    card.appendChild(del);

    card.onclick = () => openEditModal(card);

    container.appendChild(card);
  }

  // Открыть/закрыть модалки
  function openAddModal() {
    editingCard = null;
    addForm.reset();
    modal.querySelector("#modalTitle").textContent = "Добавить заявку на рейс";
    addForm.querySelector("button[type=submit]").textContent = "Добавить";
    modal.classList.remove("hidden");
  }
  function closeAddModal() {
    modal.classList.add("hidden");
    addForm.reset();
  }
  function openEditModal(card) {
    editingCard = card;
    const data = JSON.parse(card.dataset.flight);
    modal.querySelector("#modalTitle").textContent = "Редактировать заявку";
    addForm.querySelector("button[type=submit]").textContent = "Сохранить";
    [
      "from",
      "departureDate",
      "to",
      "transport",
      "capacity",
      "responsible",
      "phone",
    ].forEach((key) => {
      document.getElementById(key + "Input").value = data[key];
    });
    modal.classList.remove("hidden");
  }

  // Работа с данными
  function addFlight(data) {
    userFlights.push(data);
    allFlights.push(data);
  }
  function updateFlight(oldData, newData) {
    [userFlights, allFlights].forEach((arr) => {
      const i = arr.findIndex(
        (f) => JSON.stringify(f) === JSON.stringify(oldData)
      );
      if (i > -1) arr[i] = newData;
    });
  }
  function removeFlight(data) {
    [userFlights, allFlights].forEach((arr) => {
      const i = arr.findIndex(
        (f) => JSON.stringify(f) === JSON.stringify(data)
      );
      if (i > -1) arr.splice(i, 1);
    });
  }

  // Обработчик формы добавления/редактирования
  addForm.onsubmit = (e) => {
    e.preventDefault();
    const data = [
      "from",
      "departureDate",
      "to",
      "transport",
      "capacity",
      "responsible",
      "phone",
    ].reduce((o, key) => {
      o[key] = document.getElementById(key + "Input").value.trim();
      return o;
    }, {});
    if (Object.values(data).some((v) => !v)) {
      return alert("Заполните все поля");
    }
    if (editingCard) {
      const old = JSON.parse(editingCard.dataset.flight);
      updateFlight(old, data);
    } else {
      addFlight(data);
    }
    closeAddModal();
    renderUser();
    renderAll();
  };

  // Рендер списков
  function renderUser() {
    clearChildren(userList);
    userFlights.forEach((f) => createCard(f, userList));
  }
  function renderAll(filtered = null) {
    clearChildren(allList);
    (filtered || allFlights).forEach((f) => createCard(f, allList));
  }

  // Фильтрация
  filterForm.onsubmit = (e) => {
    e.preventDefault();
    const flt = {
      from: document.getElementById("filterFrom").value.trim().toLowerCase(),
      to: document.getElementById("filterTo").value.trim().toLowerCase(),
      date: document.getElementById("filterDate").value.trim(),
      tr: document.getElementById("filterTransport").value.trim().toLowerCase(),
      cap: document.getElementById("filterCapacity").value.trim(),
    };
    const result = allFlights.filter((f) => {
      if (flt.from && !f.from.toLowerCase().includes(flt.from)) return false;
      if (flt.to && !f.to.toLowerCase().includes(flt.to)) return false;
      if (flt.date && f.departureDate !== flt.date) return false;
      if (flt.tr && !f.transport.toLowerCase().includes(flt.tr)) return false;
      if (flt.cap && f.capacity !== flt.cap) return false;
      return true;
    });
    renderAll(result);
    filterModal.classList.add("hidden");
  };

  // Запуск стартового экрана
  showScreen("screen1");
});
