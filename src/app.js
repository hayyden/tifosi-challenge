// Tifosi core logic. TODO: Google analytics; host website; Google adds; Github.
// loads today's challenge and handles guesses
console.log('Tifosi app.js loaded');

// date format: YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// error message handler
function showErrorMessage(errorType) {
  let title, message, suggestion;

  switch (errorType) {
    case 'CHALLENGE_UNAVAILABLE':
      title = 'Challenge Unavailable';
      message = 'There\'s no challenge available at the moment.';
      suggestion = 'Check back tomorrow for a new challenge!';
      break;
    case 'SERVER_ERROR':
      title = 'Server Error';
      message = 'Our servers are having trouble right now.';
      suggestion = 'Please try refreshing the page.';
      break;
    case 'INVALID_CHALLENGE_DATA':
      title = 'Data Error';
      message = 'There appears to be an issue with today\'s challenge data.';
      suggestion = 'Please try refreshing the page.';
      break;
    default:
      title = 'Loading Error';
      message = 'We couldn\'t load today\'s challenge.';
      suggestion = 'Please check your internet connection and try refreshing the page.';
  }

  document.getElementById('game-root').innerHTML = `
    <div class="mt-8 text-center max-w-md mx-auto">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-red-800 mb-2">${title}</h3>
        <p class="text-red-700 mb-2">${message}</p>
        <p class="text-red-600 text-sm mb-5">${suggestion}</p>
        <button onclick="location.reload()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
          Refresh
        </button>
      </div>
    </div>
  `;
}

// Update meta tags based on today's challenge
function updateMetaTags(challenge) {
  const baseUrl = window.location.origin;
  const imageUrl = `${baseUrl}/${challenge.image}`;
  //const todayString = getTodayString();

  // Update meta description
  //updateMetaTag('name', 'description', `Can you identify today's F1 circuit? Test your Formula 1 knowledge with our daily challenge for ${formattedDate}.`);

  // Update Open Graph tags
  //updateMetaTag('property', 'og:title', `Tifosi - ${todayString} Daily Motorsport Challenge`);
  //updateMetaTag('property', 'og:description', `Can you identify today's motorsport race track? Test your Formula 1 knowledge with our daily challenge.`);
  updateMetaTag('property', 'og:image', imageUrl);
  updateMetaTag('property', 'og:url', window.location.href);

  // Update Twitter Card tags
  //updateMetaTag('name', 'twitter:title', `Tifosi - ${todayString} F1 Circuit Challenge`);
  //updateMetaTag('name', 'twitter:description', `Can you identify today's F1 circuit? Test your Formula 1 knowledge with our daily challenge.`);
  updateMetaTag('name', 'twitter:image', imageUrl);
}

// Generate credit HTML from structured data
function generateCreditHTML(credit) {
  return `<a href="${credit.pageUrl}">${credit.author}</a>, <a href="${credit.licenseUrl}">${credit.license}</a>, via ${credit.source}`;
}

// Helper function to update meta tags
function updateMetaTag(attribute, name, content) {
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (element) {
    element.setAttribute('content', content);
  } else {
    // Create the meta tag if it doesn't exist
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    element.setAttribute('content', content);
    document.head.appendChild(element);
  }
}

const maxAttempts = 5;
let attempts = 0;
let incorrectAttempts = 0;
let guesses = [];
let incorrectGuesses = [];
let solved = false;

// show loading text
document.getElementById('game-root').innerHTML = '<div class="text-center text-gray-500 mt-8">Loading today\'s challenge...</div>';

// load today's challenge data
const todayString = getTodayString();
console.log('Looking for challenge file:', `src/data/${todayString}.json`);
fetch(`src/data/${todayString}.json`)
  .then(res => {
    console.log('Fetch response status:', res.status);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('CHALLENGE_UNAVAILABLE');
      } else if (res.status >= 500) {
        throw new Error('SERVER_ERROR');
      } else {
        throw new Error(`HTTP_ERROR_${res.status}`);
      }
    }
    return res.json();
  })
  .then(challenge => {
    // validate challenge data
    if (!challenge.answer || !challenge.image) {
      throw new Error('INVALID_CHALLENGE_DATA');
    }

    updateMetaTags(challenge);

    renderGame(challenge);
  })
  .catch(error => {
    console.error('Failed to load challenge:', error);
    showErrorMessage(error.message);
  });

function getPreviousGuessesText() {
  if (incorrectGuesses.length === 0) {
    return '';
  } else {
    return `<strong>Previous guesses:</strong> ${incorrectGuesses.join('; ')}.`;
  }
}

function getMessageText() {
  if (solved) {
    return 'See you tomorrow!';
  } else if (attempts >= maxAttempts) {
    return 'Try again tomorrow!';
  } else {
    return '';
  }
}

function renderGame(challenge) {
  const root = document.getElementById('game-root');
  const gameOver = attempts >= maxAttempts && !solved;

  root.innerHTML = `
    <!-- IMAGE COMPONENT --!>
    <div class="mb-1 flex justify-center">
      <img src="${challenge.image}" 
           alt="Challenge" 
           class="rounded-lg border max-w-full transition-all duration-500"
           onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4='; this.alt='Image could not be loaded';" />
    </div>
    
    <!-- IMAGE CREDIT COMPONENT -->
    <div class="mb-3 text-center">
      <p class="text-xs text-gray-500">${generateCreditHTML(challenge.credit)}</p>
    </div>

    <!-- LIGHT ARRAY COMPONENT --!>
    <div class="flex justify-center mb-4">
      <div class="relative">

        <!-- HORIZONTAL CONNECTING BAR -->
        <div class="absolute top-1/2 left-0 right-0 h-4 bg-gray-700 transform -translate-y-1/2 rounded"></div>

        <!-- INDIVIDUAL LIGHT ARRAY -->
        <div class="flex gap-2 relative z-10">
        ${Array.from({ length: maxAttempts }, (_, i) =>
    `<div class="w-12 h-24 bg-gray-900 rounded-lg flex flex-col items-center justify-center">
          <div class="w-8 h-8 rounded-full mb-2 ${i < incorrectAttempts ? 'bg-red-500' : 'bg-gray-500'}"></div>
          <div class="w-8 h-8 rounded-full ${i < incorrectAttempts ? 'bg-red-500' : 'bg-gray-500'}"></div>
            </div>`
  ).join('')}

        </div>
      </div>
    </div>
    
    <!-- GUESS INPUT BOX COMPONENT --!>
    ${gameOver ?
      `<div class="flex justify-center mb-3">
        <div id="game-over-message" class="text-center p-2 bg-red-100 border border-red-300 rounded" style="width: 400px;"><strong>Out of attempts!</strong> The answer was <i>${challenge.answer[0]}</i>.</div>
      </div>` :

      solved ?
        `<div class="flex justify-center mb-3">
        <div id="success-message" class="text-center p-2 bg-green-100 border border-green-300 rounded" style="width: 400px;"><strong>Correct!</strong> The answer is <i>${challenge.answer[0]}</i>.</div>
      </div>` :

        `<div class="flex justify-center mb-3">
        <input type="text" id="guess-input" class="border p-2 rounded" style="width: 400px;" placeholder="Enter your guess..." />
      </div>`
    }

    <!-- PREVIOUS GUESSES COMPONENT --!>
    <div id="previous-guesses" class="mb-2 text-center min-h-[24px]">${getPreviousGuessesText()}</div>
    
    <!-- MESSAGE COMPONENT --!>
    <div id="message" class="mb-2 text-center text-lg min-h-[24px]">${getMessageText()}</div>
    `;

  if (!gameOver && !solved) {
    document.getElementById('guess-input').onkeydown = e => { if (e.key === 'Enter') handleGuess(challenge); };
  }
}

function handleGuess(challenge) {
  const input = document.getElementById('guess-input');
  const guess = input.value.trim();

  if (!guess) return;

  // adds guess to guesses list
  guesses.push(guess);
  attempts++;

  const isCorrect = challenge.answer.some(answer => normalize(guess) === normalize(answer));
  if (isCorrect) {
    solved = true;
  } else {
    incorrectAttempts++;
    incorrectGuesses.push(guess);
  }

  // re-render with updated state
  renderGame(challenge);
}

function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[.,\-_']/g, '') // remove punctuation
    .replace(/\s*(circuit|track|raceway|speedway|international)\s*/g, '');
}
