let clipboardText = "";
let wakeLock = null;

// Run initialization when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateHydration();
});

// --- Theme & Storage Logic ---

function loadSettings() {
  const savedQty = localStorage.getItem('pizzaQty');
  const savedHydration = localStorage.getItem('pizzaHydration');
  const savedTheme = localStorage.getItem('theme');

  // Restore quantity if exists
  if (savedQty) {
    document.getElementById('numPizzas').value = savedQty;
  }

  // Restore hydration if exists
  if (savedHydration) {
    document.getElementById('hydrationSlider').value = savedHydration;
  }

  // Restore dark mode if it was toggled on
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('darkModeToggle').checked = true;
  }
}

function saveSettings() {
  const qty = document.getElementById('numPizzas').value;
  const hydration = document.getElementById('hydrationSlider').value;
  
  localStorage.setItem('pizzaQty', qty);
  localStorage.setItem('pizzaHydration', hydration);
}

function toggleDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  
  if (toggle.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
}

// --- Calculator Logic ---

function updateHydration() {
  const sliderVal = document.getElementById('hydrationSlider').value;
  document.getElementById('hydrationVal').innerText = sliderVal + '%';
  
  // Update Dynamic Helper Text
  const h = parseInt(sliderVal);
  let helpText = "";
  
  if (h === 67) {
    helpText = "Vito Iacopelli's original recipe. Sticky dough, but yields a beautifully light, puffy crust.";
  } else if (h >= 55 && h <= 59) {
    helpText = "Easier to handle and stretch. Great for standard home ovens and a crispier base.";
  } else if (h >= 60 && h <= 66) {
    helpText = "The sweet spot. A great balance of workability and an airy crust.";
  } else if (h >= 68 && h <= 70) {
    helpText = "Advanced. Very sticky dough requiring strong flour and excellent technique.";
  }
  
  document.getElementById('hydrationHelp').innerText = helpText;

  calculate();
}

function adjustQty(change) {
  const input = document.getElementById('numPizzas');
  let current = parseInt(input.value);
  
  if (isNaN(current)) current = 0;
  
  let newVal = current + change;
  if (newVal < 1) newVal = 1;
  
  input.value = newVal;
  calculate();
}

function calculate() {
  let num = parseInt(document.getElementById('numPizzas').value);
  let targetHydration = parseInt(document.getElementById('hydrationSlider').value) / 100;
  
  // Save settings whenever a calculation runs
  saveSettings();
  
  if (isNaN(num) || num < 1) {
    document.getElementById('results').innerHTML = '<p class="empty-state">Please enter a number above to see your recipe.</p>';
    clipboardText = "";
    return; 
  }

  // Mathematical Rules
  const targetBallWeight = 250;
  const saltPerPizza = 4;
  const flourWaterWeightPerPizza = targetBallWeight - saltPerPizza; 
  
  const totalFlourPerPizza = flourWaterWeightPerPizza / (1 + targetHydration);
  const totalWaterPerPizza = flourWaterWeightPerPizza - totalFlourPerPizza;
  
  const poolishFlourRatio = 67 / 150; 
  const poolishFlourPerPizza = totalFlourPerPizza * poolishFlourRatio;
  const poolishWaterPerPizza = poolishFlourPerPizza; 

  const totalFlourPrecise = totalFlourPerPizza * num;
  const totalWaterPrecise = totalWaterPerPizza * num;
  const pFlourPrecise = poolishFlourPerPizza * num;

  // Final Rounded Ingredient Weights
  const pFlour = Math.round(pFlourPrecise);
  const pWater = pFlour; 
  
  const totalFlour = Math.round(totalFlourPrecise);
  const totalWater = Math.round(totalWaterPrecise);
  
  const dFlour = totalFlour - pFlour;
  const dWater = totalWater - pWater;
  const dSalt = saltPerPizza * num;

  // Yeast & Honey Rules
  let pYeast = 5;
  if (num === 1) {
    pYeast = 2;
  } else {
    if (num < 10) pYeast = 5;
    else if (num < 20) pYeast = 10;
    else pYeast = 15; 
  }
  let pHoney = (num === 1) ? 2 : 5;

  // Totals
  const displayHydration = ((totalWater / totalFlour) * 100).toFixed(1);
  const totalWeight = pWater + pFlour + pYeast + pHoney + dWater + dFlour + dSalt;

  // Build the Text String for Clipboard
  clipboardText = `Pizza dough recipe (${num}x 250g balls @ ${displayHydration}% hydration)\n\n` +
    `1. Poolish:\n` +
    `- Water: ${pWater}g\n` +
    `- Flour: ${pFlour}g\n` +
    `- Yeast: ${pYeast}g\n` +
    `- Honey: ${pHoney}g\n\n` +
    `2. Main dough:\n` +
    `- Water: ${dWater}g\n` +
    `- Flour: ${dFlour}g\n` +
    `- Salt: ${dSalt}g\n\n` +
    `Totals:\n` +
    `- Total flour: ${totalFlour}g\n` +
    `- Total water: ${totalWater}g\n` +
    `- Total weight: ${totalWeight}g`;

  // Build the UI HTML
  let html = `
    <div class="recipe-section">
      <h2>1. Poolish</h2>
      <ul>
        <li><span>Water</span> <span class="weight">${pWater}g</span></li>
        <li><span>Flour</span> <span class="weight">${pFlour}g</span></li>
        <li><span>Yeast</span> <span class="weight">${pYeast}g</span></li>
        <li><span>Honey</span> <span class="weight">${pHoney}g</span></li>
      </ul>
    </div>

    <div class="recipe-section">
      <h2>2. Main dough</h2>
      <ul>
        <li><span>Water</span> <span class="weight">${dWater}g</span></li>
        <li><span>Flour</span> <span class="weight">${dFlour}g</span></li>
        <li><span>Salt</span> <span class="weight">${dSalt}g</span></li>
      </ul>
    </div>

    <div class="totals">
      <ul>
        <li><span>Total flour</span> <span>${totalFlour}g</span></li>
        <li><span>Total water</span> <span>${totalWater}g</span></li>
        <li><span>Actual hydration</span> <span>${displayHydration}%</span></li>
        <li><span>Total dough weight</span> <span>${totalWeight}g</span></li>
      </ul>
    </div>
    
    <button class="copy-btn" onclick="copyRecipe(this)">Copy recipe to clipboard</button>
  `;

  document.getElementById('results').innerHTML = html;
}

// --- Helper Functions (Copy & Wake Lock) ---

function copyRecipe(button) {
  if (!clipboardText) return;
  
  navigator.clipboard.writeText(clipboardText).then(() => {
    const originalText = button.innerText;
    button.innerText = "✓ Copied!";
    button.style.backgroundColor = "#2a9d8f"; 
    
    setTimeout(() => {
      button.innerText = originalText;
      button.style.backgroundColor = "var(--primary)";
    }, 2000);
  }).catch(err => {
    alert("Failed to copy text. Your browser might block this feature.");
  });
}

async function toggleWakeLock() {
  const toggle = document.getElementById('wakeLockToggle');
  
  if (toggle.checked) {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        alert("Your browser blocked the Wake Lock feature. Make sure you're viewing this on a secure connection (HTTPS).");
        toggle.checked = false;
      }
    } else {
      alert("Your browser doesn't support the Screen Wake Lock API.");
      toggle.checked = false;
    }
  } else {
    if (wakeLock !== null) {
      wakeLock.release().then(() => {
        wakeLock = null;
      });
    }
  }
}

document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    const toggle = document.getElementById('wakeLockToggle');
    if (toggle.checked) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error("Could not re-acquire wake lock.");
      }
    }
  }
});