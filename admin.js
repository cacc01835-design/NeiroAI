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
    if (!usersList) return;
    usersList.innerHTML = '';

    activeUsers.forEach(user => {
      const userDiv = document.createElement('div');
      userDiv.dataset.userId = user.id;
      userDiv.className = `user-item ${selectedUser === user.id ? 'active' : ''}`;

      userDiv.innerHTML = `
        <div class="user-info">
          <span>${user.name || 'Анонимный пользователь'}</span>
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
      const deleteBtn = userDiv.querySelector('.delete-chat-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          deleteChat(user.id);
        });
      }

      userDiv.addEventListener('click', function() {
        // Выделяем выбранного пользователя
        document.querySelectorAll('.user-item').forEach(div => {
          div.classList.remove('active');
        });
        this.classList.add('active');

        selectedUser = user.id;
        displayChatHistory(user.id);
        if (adminResponse) {
          adminResponse.disabled = false;
          sendResponseBtn.disabled = false;
          adminResponse.focus();
        }
      });

      usersList.appendChild(userDiv);
    });

    if (usersCount) {
      usersCount.textContent = activeUsers.length;
    }
  }

  // Функция отображения истории чата
  function displayChatHistory(userId) {
    if (!chatHistory) return;
    chatHistory.innerHTML = '';

    const user = activeUsers.find(u => u.id === userId);
    if (user && user.messages) {
      user.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-in-admin ${msg.isUser ? 'user-message-in-admin' : 'admin-message-in-admin'}`;
        messageDiv.textContent = msg.text;
        chatHistory.appendChild(messageDiv);
      });
    } else {
      chatHistory.innerHTML = '<p>История чата пуста</p>';
    }
    if (chatHistory.scrollHeight) {
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }

  // Основная функция синхронизации
  function syncUsers() {
    const newUsers = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(USER_STORAGE_PREFIX)) {
          try {
            const userData = JSON.parse(localStorage.getItem(key));
            if (!userData.isOnline) {
              userData.isOnline = true;
            }
            newUsers.push(userData);
          } catch (e) {
            console.error('Ошибка парсинга данных пользователя:', key, e);
          }
        }
      }
    } catch (e) {
      console.error('Ошибка доступа к localStorage:', e);
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
    if (!selectedUser || !adminResponse || !adminResponse.value.trim()) return;

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
      try {
        localStorage.setItem(selectedUser, JSON.stringify(activeUsers[userIndex]));
      } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        return;
      }

      // Обновляем отображение
      displayChatHistory(selectedUser);
      adminResponse.value = '';
    }
  }

  // Функция очистки истории всех чатов
  function clearAllHistory() {
    if (!confirm('Вы уверены, что хотите очистить историю всех чатов?')) return;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(USER_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      syncUsers();
      if (chatHistory) {
        chatHistory.innerHTML = '<p>История очищена</p>';
      }
    } catch (e) {
      console.error('Ошибка очистки истории:', e);
    }
  }

  // Функция удаления конкретного чата
  function deleteChat(userId) {
    const userName = activeUsers.find(u => u.id === userId)?.name || 'Этот пользователь';
    if (!confirm(`Вы уверены, что хотите удалить чат с ${userName}?`)) return;

    localStorage.removeItem(userId);
    syncUsers();

    if (selectedUser === userId) {
      if (chatHistory) {
        chatHistory.innerHTML = '<p>Чат удалён</p>';
      }
      selectedUser = null;
      if (adminResponse) {
        adminResponse.disabled = true;
        sendResponseBtn.disabled = true;
      }
    }
  }

  // Инициализация
syncUsers();
const syncInterval = setInterval(syncUsers, 2000); // Синхронизация каждые 2 секунды

// Обработчики событий
if (sendResponseBtn) {
  sendResponseBtn.addEventListener('click', sendAdminResponse);
}

if (adminResponse) {
  adminResponse.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAdminResponse();
    }
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', clearAllHistory);
}

// Очистка интервалов при закрытии страницы
window.addEventListener('beforeunload', function() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
});

// Обработка ошибок localStorage
function isLocalStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.error('localStorage недоступен:', e);
    return false;
  }
}

// Проверка доступности localStorage перед инициализацией
if (!isLocalStorageAvailable()) {
  // Если localStorage недоступен, показываем сообщение об ошибке
  if (chatHistory) {
    chatHistory.innerHTML = '<p style="color: red;">Ошибка: localStorage недоступен. Функционал чата ограничен.</p>';
  }
  // Отключаем кнопки, зависящие от localStorage
  if (sendResponseBtn) sendResponseBtn.disabled = true;
  if (clearHistoryBtn) clearHistoryBtn.disabled = true;
  if (adminResponse) adminResponse.disabled = true;
  return;
}

// Дополнительная синхронизация при изменении localStorage извне
window.addEventListener('storage', function(e) {
  if (e.key && e.key.startsWith(USER_STORAGE_PREFIX)) {
    syncUsers();
  }
});

// Функция для ручного обновления (на случай проблем с автосинхронизацией)
function manualSync() {
  syncUsers();
}

// Добавляем кнопку ручной синхронизации (опционально)

const manualSyncBtn = document.createElement('button');
manualSyncBtn.textContent = 'Обновить вручную';
manualSyncBtn.className = 'manual-sync-btn';
manualSyncBtn.style.cssText = 'margin: 10px; padding: 5px 10px;';
manualSyncBtn.addEventListener('click', manualSync);
document.body.appendChild(manualSyncBtn);


// Первоначальная проверка состояния
setTimeout(() => {
  if (activeUsers.length === 0) {
    if (chatHistory) {
      chatHistory.innerHTML = '<p>Нет активных пользователей</p>';
    }
    if (usersCount) {
      usersCount.textContent = '0';
    }
  }
}, 100);
});
