let clipboardText = "";
let wakeLock = null;
let currentDough = 'poolish'; // Default state

// Run initialization when the page loads
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateHydration();
});

// --- Memory & Settings Logic ---
function loadSettings() {
  const savedQty = localStorage.getItem('pizzaQty');
  const savedHydration = localStorage.getItem('pizzaHydration');
  const savedDough = localStorage.getItem('doughType');
  const savedTheme = localStorage.getItem('theme');

  // Load dough type
  if (savedDough) {
    currentDough = savedDough;
    
    document.querySelectorAll('.dough-btn').forEach(btn => btn.classList.remove('active'));
    if (currentDough === 'poolish') {
      document.getElementById('btnPoolish').classList.add('active');
      document.getElementById('poolishMethod').style.display = 'block';
      document.getElementById('sameDayMethod').style.display = 'none';
    } else {
      document.getElementById('btnSameDay').classList.add('active');
      document.getElementById('poolishMethod').style.display = 'none';
      document.getElementById('sameDayMethod').style.display = 'block';
    }
  }

  // Load inputs
  if (savedQty) { document.getElementById('numPizzas').value = savedQty; }
  if (savedHydration) { document.getElementById('hydrationSlider').value = savedHydration; }

  // Load theme
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
  localStorage.setItem('doughType', currentDough);
}

function resetSettings() {
  // Trigger native confirmation dialog
  if (confirm("Are you sure you want to reset the calculator back to its default state?")) {
    // Clear everything except Dark Mode preference
    localStorage.removeItem('pizzaQty');
    localStorage.removeItem('pizzaHydration');
    localStorage.removeItem('doughType');
    
    // Clear the input field
    document.getElementById('numPizzas').value = '';
    
    // Reset to defaults
    setDoughType('poolish'); 
  }
}

// --- Navigation Logic ---
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

function setDoughType(type) {
  currentDough = type;
  
  // Update toggle buttons UI
  document.querySelectorAll('.dough-btn').forEach(btn => btn.classList.remove('active'));
  if (type === 'poolish') {
    document.getElementById('btnPoolish').classList.add('active');
    document.getElementById('hydrationSlider').value = 67; // Default for poolish
    document.getElementById('poolishMethod').style.display = 'block';
    document.getElementById('sameDayMethod').style.display = 'none';
  } else {
    document.getElementById('btnSameDay').classList.add('active');
    document.getElementById('hydrationSlider').value = 60; // Default authentic Neapolitan
    document.getElementById('poolishMethod').style.display = 'none';
    document.getElementById('sameDayMethod').style.display = 'block';
  }
  
  saveSettings();
  updateHydration();
}

// --- Theme Logic ---
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
  
  const h = parseInt(sliderVal);
  let helpText = "";
  
  // Custom helper text based on dough type
  if (currentDough === 'poolish') {
    if (h === 67) {
      helpText = "Vito Iacopelli's original recipe. Sticky dough, but yields a beautifully light, puffy crust.";
    } else if (h >= 55 && h <= 59) {
      helpText = "Easier to handle and stretch. Great for standard home ovens and a crispier base.";
    } else if (h >= 60 && h <= 66) {
      helpText = "The sweet spot. A great balance of workability and an airy crust.";
    } else if (h >= 68 && h <= 70) {
      helpText = "Advanced. Very sticky dough requiring strong flour and excellent technique.";
    }
  } else {
    // Same day authentic Neapolitan helper text
    if (h >= 55 && h <= 58) {
      helpText = "Classic firm Neapolitan. Very easy to handle and launch into the oven.";
    } else if (h >= 59 && h <= 62) {
      helpText = "The authentic Associazione Verace Pizza Napoletana (AVPN) sweet spot. Soft, extensible, and perfect for high-heat ovens.";
    } else if (h >= 63 && h <= 70) {
      helpText = "Modern 'Canotto' style. Higher hydration requires stronger flour and careful stretching.";
    }
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
  
  saveSettings();
  
  if (isNaN(num) || num < 1) {
    document.getElementById('results').innerHTML = '<p class="empty-state">Please enter a number above to see your recipe.</p>';
    clipboardText = "";
    return; 
  }

  const targetBallWeight = 250;
  const saltPerPizza = 4;
  const flourWaterWeightPerPizza = targetBallWeight - saltPerPizza; 
  
  const totalFlourPerPizza = flourWaterWeightPerPizza / (1 + targetHydration);
  const totalWaterPerPizza = flourWaterWeightPerPizza - totalFlourPerPizza;

  const totalFlour = Math.round(totalFlourPerPizza * num);
  const totalWater = Math.round(totalWaterPerPizza * num);
  const dSalt = saltPerPizza * num;
  const displayHydration = ((totalWater / totalFlour) * 100).toFixed(1);

  let html = '';

  if (currentDough === 'poolish') {
    // POOLISH MATH
    const poolishFlourRatio = 67 / 150; 
    const pFlour = Math.round((totalFlourPerPizza * poolishFlourRatio) * num);
    const pWater = pFlour; // 100% hydration poolish
    
    const dFlour = totalFlour - pFlour;
    const dWater = totalWater - pWater;

    // Poolish Yeast & Honey Rules
    let pYeast = 5;
    if (num === 1) { pYeast = 2; } 
    else if (num < 10) { pYeast = 5; }
    else if (num < 20) { pYeast = 10; }
    else { pYeast = 15; }
    
    let pHoney = (num === 1) ? 2 : 5;
    const totalWeight = pWater + pFlour + pYeast + pHoney + dWater + dFlour + dSalt;

    clipboardText = `Poolish dough recipe (${num}x 250g balls @ ${displayHydration}% hydration)\n\n` +
      `1. Poolish:\n- Water: ${pWater}g\n- Flour: ${pFlour}g\n- Yeast: ${pYeast}g\n- Honey: ${pHoney}g\n\n` +
      `2. Main dough:\n- Water: ${dWater}g\n- Flour: ${dFlour}g\n- Salt: ${dSalt}g\n\n` +
      `Totals:\n- Total flour: ${totalFlour}g\n- Total water: ${totalWater}g\n- Total weight: ${totalWeight}g`;

    html = `
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

  } else {
    // SAME DAY MATH
    const sdYeast = (num * 0.5).toFixed(1); 
    const totalWeight = totalWater + totalFlour + dSalt + parseFloat(sdYeast);

    clipboardText = `Same day Neapolitan dough (${num}x 250g balls @ ${displayHydration}% hydration)\n\n` +
      `Ingredients:\n- Water: ${totalWater}g\n- Flour: ${totalFlour}g\n- Salt: ${dSalt}g\n- Yeast: ${sdYeast}g\n\n` +
      `Totals:\n- Total dough weight: ${totalWeight}g`;

    html = `
      <div class="recipe-section">
        <h2>Ingredients</h2>
        <ul>
          <li><span>Water</span> <span class="weight">${totalWater}g</span></li>
          <li><span>Flour</span> <span class="weight">${totalFlour}g</span></li>
          <li><span>Salt</span> <span class="weight">${dSalt}g</span></li>
          <li><span>Yeast (Instant/Dry)</span> <span class="weight">${sdYeast}g</span></li>
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
  }

  document.getElementById('results').innerHTML = html;
}

// --- Helper Functions ---
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
      wakeLock.release().then(() => { wakeLock = null; });
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