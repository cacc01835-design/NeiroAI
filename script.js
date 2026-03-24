document.addEventListener('DOMContentLoaded', function() {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const nameInput = document.getElementById('userNameInput');
  const submitNameBtn = document.getElementById('submitName');
  const logoutBtn = document.querySelector('.logout-btn');

  let userName = '';
  let userId = '';
  let isWaitingForResponse = false; // Флаг ожидания ответа

  // Функция добавления сообщения в чат
  function addMessage(text, isUser, senderName = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;

    if (isUser) {
      messageDiv.innerHTML = `<strong>${senderName}:</strong> ${text}`;
    } else {
      messageDiv.textContent = text;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Функция отображения индикатора «думает»
  function showThinkingIndicator() {
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message ai-message';
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.innerHTML = 'НейроИИ думает... <span class="typing-indicator">' +
      '<span class="typing-dot"></span>' +
      '<span class="typing-dot"></span>' +
      '<span class="typing-dot"></span>' +
      '</span>';
    chatMessages.appendChild(thinkingDiv);
  }

  // Функция удаления индикатора «думает»
  function removeThinkingIndicator() {
    const indicator = document.getElementById('thinking-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Блокировка чата
  function blockChat() {
    isWaitingForResponse = true;
    userInput.disabled = true;
    sendBtn.disabled = true;
    showThinkingIndicator();
  }

  // Разблокировка чата
  function unblockChat() {
    isWaitingForResponse = false;
    userInput.disabled = false;
    sendBtn.disabled = false;
    removeThinkingIndicator();
  }

  // Обработчик отправки имени
  submitNameBtn.addEventListener('click', function() {
    const name = nameInput.value.trim();
    if (!name) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }

    userName = name;
    userId = 'user_' + Date.now();

    // Сохраняем данные пользователя в LocalStorage
    const userData = {
      id: userId,
      name: name,
      messages: [],
      isOnline: true
    };
    localStorage.setItem(userId, JSON.stringify(userData));

    // Скрываем форму ввода имени
    document.querySelector('.name-input-section').style.display = 'none';

    // Активируем поля ввода сообщений
    userInput.disabled = false;
    sendBtn.disabled = false;

    // Показываем кнопку выхода
    logoutBtn.style.display = 'block';

    // Приветственное сообщение от НейроИИ
    setTimeout(() => {
      addMessage(`Здравствуйте, ${name}! Я НейроИИ. Чем могу помочь?`, false);
    }, 500);

    startMonitoring();
  });

  nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      submitNameBtn.click();
    }
  });

  // Обработчик отправки сообщения
  function sendMessage() {
    if (isWaitingForResponse) return; // Если ждём ответа, не отправляем новое сообщение

    const text = userInput.value.trim();
    if (!text) return;

    // Добавляем сообщение пользователя
    addMessage(text, true, userName);
    userInput.value = '';

    // Блокируем чат и показываем индикатор
    blockChat();

    // Обновляем историю сообщений в LocalStorage
    const storedUser = JSON.parse(localStorage.getItem(userId));
    if (storedUser) {
      storedUser.messages.push({
        text: text,
        isUser: true,
        seenByUser: true
      });
      localStorage.setItem(userId, JSON.stringify(storedUser));
      window.dispatchEvent(new Event('userMessage'));
    }
    /*
    // Имитация ответа через 2–4 секунды
    setTimeout(() => {
      const aiResponses = [
        'Спасибо за вопрос, готовлю ответ...',
        'Секунду...',
        'Это хороший вопрос. Я готовлю ответ...',
        'Думаю...',
        'Размышляю над вашим вопросом...'
      ];
      const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];

      // Добавляем ответ ИИ
      addMessage(response, false, 'НейроИИ');

      // Обновляем LocalStorage с ответом ИИ
      const updatedUser = JSON.parse(localStorage.getItem(userId));
      if (updatedUser) {
        updatedUser.messages.push({
          text: response,
          isUser: false,
          seenByUser: false
        });
        localStorage.setItem(userId, JSON.stringify(updatedUser));
      }

      unblockChat();
    }, 2000 + Math.random() * 2000); */
  }

  sendBtn.addEventListener('click', sendMessage);
  userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Мониторинг обновлений чата (ответы администратора)
  function startMonitoring() {
    setInterval(() => {
      const storedUser = JSON.parse(localStorage.getItem(userId));
      if (storedUser && storedUser.messages) {
        // Проверяем, есть ли новые сообщения от администратора
        const newAdminMessages = storedUser.messages.filter(msg =>
          !msg.isUser && !msg.seenByUser
        );

        if (newAdminMessages.length > 0) {
          // Очищаем чат и перестраиваем его
          chatMessages.innerHTML = '';
          storedUser.messages.forEach(msg => {
            // Помечаем сообщение как просмотренное
            if (!msg.isUser && !msg.seenByUser) {
              msg.seenByUser = true;
            }
            addMessage(msg.text, msg.isUser, msg.isUser ? userName : 'НейроИИ');
          });

          // Разблокируем чат после получения ответа
          unblockChat();

          // Сохраняем обновлённые данные с флагами просмотра
          localStorage.setItem(userId, JSON.stringify(storedUser));
        }
      }
    }, 1000); // Проверка каждую секунду
  }

  // Кнопка выхода
  logoutBtn.addEventListener('click', function() {
    if (confirm('Вы уверены, что хотите выйти из чата?')) {
      // Помечаем пользователя как оффлайн
      const storedUser = JSON.parse(localStorage.getItem(userId));
      if (storedUser) {
        storedUser.isOnline = false;
        localStorage.setItem(userId, JSON.stringify(storedUser));
      }

      // Очищаем интерфейс
      chatMessages.innerHTML = '';
      userInput.value = '';
      userInput.disabled = true;
      sendBtn.disabled = true;

      // Показываем форму ввода имени снова
      document.querySelector('.name-input-section').style.display = 'block';
      nameInput.focus();

      // Скрываем кнопку выхода
      logoutBtn.style.display = 'none';

      // Удаляем данные пользователя
      userId = '';
      userName = '';
    }
  });
});

// Переключение темы
function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.classList.contains('dark-theme') ? 'dark' : 'light';

  if (currentTheme === 'light') {
    root.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
}

// Восстанавливаем тему при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-theme');
  }

  // Добавляем кнопку переключения темы в интерфейс
  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.textContent = savedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
  themeToggle.setAttribute('aria-label', `Переключить на ${savedTheme === 'dark' ? 'светлую' : 'тёмную'} тему`);

  // Вставляем кнопку в DOM — ищем подходящее место
  const header = document.querySelector('.chat-header') || document.body;
  header.appendChild(themeToggle);

  // Обработчик клика для переключения темы
  themeToggle.addEventListener('click', function() {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark-theme');

    if (isDark) {
      root.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      themeToggle.textContent = 'Тёмная тема';
      themeToggle.setAttribute('aria-label', 'Переключить на тёмную тему');
    } else {
      root.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      themeToggle.textContent = 'Светлая тема';
      themeToggle.setAttribute('aria-label', 'Переключить на светлую тему');
    }
  });
});
