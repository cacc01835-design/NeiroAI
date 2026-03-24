document.addEventListener('DOMContentLoaded', function() {
  const usersList = document.getElementById('users');
  const chatHistory = document.getElementById('chat-history');
  const adminResponse = document.getElementById('admin-response');
  const sendResponseBtn = document.getElementById('send-response');
  const clearHistoryBtn = document.getElementById('clear-history');
  const usersCount = document.getElementById('users-count');

  let activeUsers = [];
  let selectedUser = null;

  const USER_STORAGE_PREFIX = 'user_';

  // Функция обновления списка пользователей
  function updateUsersList() {
    usersList.innerHTML = '';
    activeUsers.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.dataset.userId = user.id;
      userDiv.className = `user-item ${selectedUser === user.id ? 'active' : ''}`;

      userDiv.innerHTML = `
        <div class="user-info">
          <span>${user.name}</span>
          <button class="delete-chat-btn" data-user-id="${user.id}" title="Удалить чат">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 4h10v2H3V4zm3 0v10c0 .55.45 1 1 1h4c.55 0 1-.45 1-1V4H6zm2 0v10h2V4H8z" fill="#ff4444"/>
            </svg>
          </button>
        </div>
        <div class="user-status ${user.isOnline ? 'status-online' : 'status-offline'}">
          <span class="online-indicator ${user.isOnline ? 'online' : 'offline'}"></span>
          ${user.isOnline ? 'Онлайн' : 'Оффлайн'}
        </div>
      `;

      // Обработчик для кнопки удаления чата
      userDiv.querySelector('.delete-chat-btn').addEventListener('click', function(e) {
        e.stopPropagation(); // Предотвращаем срабатывание выбора пользователя
        deleteChat(user.id);
      });

      userDiv.addEventListener('click', function() {
        // Выделяем выбранного пользователя
        document.querySelectorAll('.user-item').forEach(div => {
          div.classList.remove('active');
        });
        this.classList.add('active');

        selectedUser = user.id;
        displayChatHistory(user.id);
        adminResponse.disabled = false;
        sendResponseBtn.disabled = false;
        adminResponse.focus();
      });

      usersList.appendChild(userDiv);
    });
    usersCount.textContent = activeUsers.length;
  }

  // Функция отображения истории чата
  function displayChatHistory(userId) {
    const user = activeUsers.find(u => u.id === userId);
    chatHistory.innerHTML = '';

    if (user && user.messages) {
      user.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-in-admin ${msg.isUser ? 'user-message-in-admin' : 'admin-message-in-admin'}`;
        messageDiv.textContent = msg.text;
        chatHistory.appendChild(messageDiv);
      });
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  // Основная функция синхронизации
  function syncUsers() {
    const newUsers = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(USER_STORAGE_PREFIX)) {
        try {
          const userData = JSON.parse(localStorage.getItem(key));
          // Добавляем статус онлайн, если его нет
          if (!userData.isOnline) {
            userData.isOnline = true;
          }
          newUsers.push(userData);
        } catch (e) {
          console.error('Ошибка парсинга данных пользователя:', e);
        }
      }
    }
    activeUsers = newUsers;
    updateUsersList();

    // Если есть выбранный пользователь, обновляем его чат
    if (selectedUser) {
      displayChatHistory(selectedUser);
    }
  }

  // Функция отправки ответа администратора
  function sendAdminResponse() {
    if (!selectedUser || !adminResponse.value.trim()) return;

    const responseText = adminResponse.value.trim();

    // Находим пользователя и добавляем сообщение
    const userIndex = activeUsers.findIndex(u => u.id === selectedUser);
    if (userIndex !== -1) {
      activeUsers[userIndex].messages.push({
        text: responseText,
        isUser: false,
        seenByUser: false
      });

      // Сохраняем в LocalStorage
      localStorage.setItem(selectedUser, JSON.stringify(activeUsers[userIndex]));

      // Обновляем отображение
      displayChatHistory(selectedUser);
      adminResponse.value = '';
    }
  }

  // Функция очистки истории всех чатов
  function clearAllHistory() {
    if (confirm('Вы уверены, что хотите очистить историю всех чатов?')) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(USER_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      syncUsers();
      chatHistory.innerHTML = '<p>История очищена</p>';
    }
  }

  // Функция удаления конкретного чата
  function deleteChat(userId) {
    if (confirm(`Вы уверены, что хотите удалить чат с ${activeUsers.find(u => u.id === userId)?.name}?`)) {
      localStorage.removeItem(userId);
      syncUsers();

      if (selectedUser === userId) {
        chatHistory.innerHTML = '<p>Чат удалён</p>';
        selectedUser = null;
        adminResponse.disabled = true;
        sendResponseBtn.disabled = true;
      }
    }
  }

  // Инициализация
  syncUsers();
  setInterval(syncUsers, 2000); // Синхронизация каждые 2 секунды

  // Обработчики событий
  sendResponseBtn.addEventListener('click', sendAdminResponse);
  adminResponse.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAdminResponse();
    }
  });

  clearHistoryBtn.addEventListener('click', clearAllHistory);
});
