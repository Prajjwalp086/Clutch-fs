const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const botToken = '6544803680:AAFQlgcgvaChA-NqZO-7hH9XuQCnfHurHNg';
const channelId = '-1002128277098';

const bot = new TelegramBot(botToken, { polling: true });

// Dictionary to store unique codes and corresponding file paths
const fileDictionary = {};

// Dictionary to track file requests by users
const fileRequestCounter = {};

bot.onText(/\/upload/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Please share the file you want to upload.').then(() => {
    // Remove any existing 'document' event listener
    bot.removeListener('document', documentListener);

    // Add a new 'document' event listener
    bot.on('document', documentListener);
  });
});

// 'document' event listener function
const documentListener = (docMsg) => {
  const fileId = docMsg.document.file_id;
  const uniqueCode = generateUniqueCode();

  // Save unique code and file_id in dictionary
  fileDictionary[uniqueCode] = fileId;

  // Forward the file to the specified channel with the unique code in the caption
  bot.forwardMessage(channelId, docMsg.chat.id, docMsg.message_id).then(() => {
    const caption = "File uploaded successfully. Your unique code is: `" + uniqueCode + "`";

    // Send the unique code to the user
    bot.sendMessage(docMsg.chat.id, caption).catch((error) => console.error(error));
  }).catch((error) => console.error(error));
};

bot.onText(/\/get/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Please enter the unique code to get the file.').then(() => {
    bot.once('text', (codeMsg) => {
      const uniqueCode = codeMsg.text;

      // Check if the unique code exists in the dictionary
      if (fileDictionary.hasOwnProperty(uniqueCode)) {
        const fileId = fileDictionary[uniqueCode];

        // Forward the file to the user who requested it
        bot.sendDocument(chatId, fileId).then(() => {
          // Send advertisement message after successfully retrieving the file
          bot.sendMessage(chatId, '🎉 Thank you for using Clutch Bot! Explore more features and stay tuned for updates.\n  🚀 Join Our Channel For New Updated [https://t.me/thetacloud] ');

          // Increment the file request counter for this unique code
          fileRequestCounter[uniqueCode] = (fileRequestCounter[uniqueCode] || 0) + 1;

          // Log the file request count
          console.log(`File request count for ${uniqueCode}: ${fileRequestCounter[uniqueCode]}`);
        }).catch((error) => console.error(error));
      } else {
        bot.sendMessage(chatId, 'Invalid unique code. Please try again.');
      }

      // Remove the event listener to avoid handling subsequent messages
      bot.removeTextListener(codeMsg.text);
    });
  });
});


// Function to generate a unique code
function generateUniqueCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Log errors to the console
bot.on('polling_error', (error) => console.error(error));

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const gifPath = 'InShot_20240201_092833387-ezgif.com-video-to-gif-converter (1).gif';  // Replace with the actual path to your GIF file

  // Send GIF along with the description
  bot.sendDocument(chatId, gifPath, {
    caption: '🚀 Welcome to Clutch Bot!\n\n' +
      'Clutch Bot is your go-to assistant for seamless file management. Get started with these commands:\n\n' +
      '- /upload: Share a file and receive a unique code.\n' +
      '- /get: Retrieve your file using the unique code.\n' +
      '- /stat: Check how popular your file is by getting its request count.\n' +
      '- /help: Learn more about Clutch Bot and connect with the developer.\n\n' +
      'Clutch Bot is here to simplify your file sharing experience. Feel free to explore the commands, and don\'t hesitate to contact us if you need any help! 🚀'
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage =
    '🤖 Clutch Bot: Your Ultimate File Management Assistant\n\n' +
    'Meet Clutch Bot, your reliable companion for effortless file management on Telegram! Whether you\'re sharing documents, images, or any file type, Clutch Bot simplifies the process with ease.\n\n' +
    '🚀 Key Features:\n' +
    '- /upload: Share files and receive a unique code for easy retrieval.\n' +
    '- /get: Retrieve your files using the unique code, making file access a breeze.\n' +
    '- /stat: Explore file popularity by checking request counts.\n' +
    '- /help: Learn more about Clutch Bot and connect with the developer.\n\n' +
    '💼 Developer Contact:\n' +
    'Connect with the developer for support, feedback, or customization requests:\n' +
    '- Instagram: https://www.instagram.com/maze.sigma?igsh=YzAwZjE1ZTI0Zg==\n\n' +
    '- Telegram: @Prajjwalp086\n\n' +
    'Clutch Bot is designed to streamline your file sharing experience. Explore its capabilities and enhance your Telegram journey today!';

  bot.sendMessage(chatId, helpMessage);
});

bot.onText(/\/stat/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Please enter the unique code to check file statistics.').then(() => {
    bot.once('text', (codeMsg) => {
      const uniqueCode = codeMsg.text;

      // Check if the unique code exists in the dictionary
      if (fileDictionary.hasOwnProperty(uniqueCode)) {
        // Increment the file request counter for this unique code
        fileRequestCounter[uniqueCode] = (fileRequestCounter[uniqueCode] || 0) + 1;

        const requestCount = fileRequestCounter[uniqueCode];
        const responseText = `Your file has been requested ${requestCount} times.`;

        // Send the file request count to the user
        bot.sendMessage(chatId, responseText).catch((error) => console.error(error));
      } else {
        bot.sendMessage(chatId, 'Invalid unique code. Please try again.');
      }

      // Remove the event listener to avoid handling subsequent messages
      bot.removeTextListener(codeMsg.text);
    });
  });
});

// Dictionary to track users in feed mode
const feedModeUsers = {};

// Counter for feed messages
let feedMessageCount = 0;

// Function to handle feed mode activation
const activateFeedMode = (userId) => {
  feedModeUsers[userId] = true;
  bot.sendMessage(userId, 'Feed mode is now ON. You will receive public messages.').catch((error) => console.error(error));
};

// Function to handle public messages
const sendPublicMessage = (message) => {
  Object.keys(feedModeUsers).forEach((userId) => {
    bot.sendMessage(userId, `📢 Public Message:\n${message}`).catch((error) => console.error(error));
  });

  // Increment feed message count
  feedMessageCount++;

  // Send advertisement message after two feed messages
  if (feedMessageCount % 2 === 0) {
    bot.sendMessage(Object.keys(feedModeUsers)[0], '🚀 Thank you for using Feed Mode! Explore more features and stay tuned for updates.');
  }
};

bot.onText(/\/feed/, (msg) => {
  const userId = msg.from.id;

  // Activate feed mode for the user
  activateFeedMode(userId);
});

bot.onText(/\/public/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, 'Please enter the public message you want to share.').then(() => {
    bot.once('text', (textMsg) => {
      const publicMessage = textMsg.text;

      // Check if at least one user is in feed mode
      if (Object.keys(feedModeUsers).length > 0) {
        // Send the public message to all users in feed mode
        sendPublicMessage(publicMessage);

        // Send confirmation message
        bot.sendMessage(chatId, 'Message sent to all users in feed mode.').catch((error) => console.error(error));
      } else {
        bot.sendMessage(chatId, 'No users in feed mode. Activate feed mode using /feed command.').catch((error) => console.error(error));
      }
    });
  });
});
