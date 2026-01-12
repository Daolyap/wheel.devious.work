// Wheel application
let items = [];
let isSpinning = false;
let rotation = 0;
let animationFrameId = null;

// Gear system state
let currentGear = 0;
let canShift = false;
let fuelLevel = 100;
let isFuelDepleting = false;
let isSlowingDown = false;
let gearEntryTime = 0;

// Canvas setup
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 240;

// Gear speed constants - speeds for each gear (radians per frame)
const GEAR_SPEEDS = {
    0: 0,           // Not spinning
    1: 0.015,       // Really slow start
    2: 0.035,       // Speed up a bit
    3: 0.06,        // Faster
    4: 0.10,        // Getting fast
    5: 0.16,        // Very fast
    6: 0.28         // Really fast in 6th gear
};

// Time to spend in each gear before shift prompt (ms)
const GEAR_DURATIONS = {
    1: 3000,   // 3 seconds in 1st gear
    2: 3000,   // 3 seconds in 2nd gear
    3: 3000,   // 3 seconds in 3rd gear
    4: 3000,   // 3 seconds in 4th gear
    5: 3000    // 3 seconds in 5th gear
};

// Fuel depletion duration (5-10 minutes)
const MIN_FUEL_DURATION = 300000; // 5 minutes
const MAX_FUEL_DURATION = 600000; // 10 minutes

// Slowdown constants
const SLOWDOWN_DURATION = 30000; // 30 seconds to fully stop

// Templates
const templates = {
    yesno: ['Yes', 'No'],
    food: ['Pizza', 'Burger', 'Sushi', 'Pasta', 'Tacos', 'Salad'],
    gamenight: ['Board Game', 'Video Game', 'Card Game', 'Party Game', 'Trivia'],
    productivity: ['Work on Project', 'Take a Break', 'Exercise', 'Read', 'Learn Something New', 'Clean Up']
};

// Colors for wheel segments
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E07A5F', '#81B29A'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add default items
    items = ['Option 1', 'Option 2', 'Option 3'];
    updateItemList();
    drawWheel();
    
    // Event listeners
    document.getElementById('addItemBtn').addEventListener('click', addItem);
    document.getElementById('newItem').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });
    document.getElementById('spinBtn').addEventListener('click', startSpin);
    document.getElementById('shiftBtn').addEventListener('click', shiftGear);
    
    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = btn.dataset.template;
            loadTemplate(template);
        });
    });
});

function loadTemplate(templateName) {
    if (templates[templateName]) {
        items = [...templates[templateName]];
        updateItemList();
        drawWheel();
    }
}

function addItem() {
    const input = document.getElementById('newItem');
    const value = input.value.trim();
    
    if (value && !items.some(item => item.toLowerCase() === value.toLowerCase())) {
        items.push(value);
        updateItemList();
        drawWheel();
        input.value = '';
    }
}

function removeItem(index) {
    items.splice(index, 1);
    updateItemList();
    drawWheel();
}

function updateItemList() {
    const list = document.getElementById('itemList');
    list.innerHTML = '';
    
    items.forEach((item, index) => {
        const li = document.createElement('li');
        
        const span = document.createElement('span');
        span.textContent = item;
        li.appendChild(span);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => {
            removeItem(index);
        });
        li.appendChild(deleteBtn);
        
        list.appendChild(li);
    });
}

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (items.length === 0) {
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Add items to spin!', centerX, centerY);
        return;
    }
    
    const anglePerItem = (2 * Math.PI) / items.length;
    
    // Draw segments
    items.forEach((item, index) => {
        const startAngle = rotation + index * anglePerItem;
        const endAngle = startAngle + anglePerItem;
        
        // Draw segment
        ctx.fillStyle = colors[index % colors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerItem / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(item, radius - 20, 5);
        ctx.restore();
    });
    
    // Draw center circle
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
}

function startSpin() {
    if (isSpinning || items.length === 0) return;
    
    isSpinning = true;
    currentGear = 1;
    canShift = false;
    fuelLevel = 100;
    isFuelDepleting = false;
    isSlowingDown = false;
    
    document.getElementById('spinBtn').disabled = true;
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'Starting...';
    resultDiv.className = 'result-display spinning';
    
    // Show gear display
    const gearDisplay = document.getElementById('gearDisplay');
    gearDisplay.classList.remove('hidden');
    updateGearDisplay();
    
    // Hide fuel container initially
    document.getElementById('fuelContainer').classList.add('hidden');
    
    const gearStartTime = Date.now();
    let currentSpeed = GEAR_SPEEDS[1];
    let targetSpeed = GEAR_SPEEDS[1];
    gearEntryTime = Date.now();
    let fuelStartTime = null;
    let fuelDuration = MIN_FUEL_DURATION + Math.random() * (MAX_FUEL_DURATION - MIN_FUEL_DURATION);
    let slowdownStartTime = null;
    let speedAtSlowdownStart = 0;
    
    function animate() {
        const now = Date.now();
        
        // Handle gear progression
        if (currentGear < 6 && !canShift) {
            const timeInGear = now - gearEntryTime;
            if (timeInGear >= GEAR_DURATIONS[currentGear]) {
                // Time to prompt for shift
                canShift = true;
                showShiftPrompt();
            }
        }
        
        // Handle fuel depletion in 6th gear
        if (currentGear === 6 && !isSlowingDown) {
            if (!isFuelDepleting) {
                isFuelDepleting = true;
                fuelStartTime = now;
                document.getElementById('fuelContainer').classList.remove('hidden');
            }
            
            const fuelElapsed = now - fuelStartTime;
            fuelLevel = Math.max(0, 100 - (fuelElapsed / fuelDuration) * 100);
            updateFuelBar();
            
            if (fuelLevel <= 0) {
                // Start slowing down
                isSlowingDown = true;
                slowdownStartTime = now;
                speedAtSlowdownStart = currentSpeed;
                const resultDiv = document.getElementById('result');
                resultDiv.textContent = 'Out of fuel... slowing down...';
            }
        }
        
        // Handle slowdown
        if (isSlowingDown) {
            const slowdownElapsed = now - slowdownStartTime;
            const slowdownProgress = Math.min(1, slowdownElapsed / SLOWDOWN_DURATION);
            // Use easeOutQuad for gradual slowdown
            const easedProgress = 1 - Math.pow(1 - slowdownProgress, 2);
            currentSpeed = speedAtSlowdownStart * (1 - easedProgress);
            targetSpeed = currentSpeed;
            
            if (slowdownProgress >= 1) {
                stopSpin();
                return;
            }
        } else {
            // Smoothly transition to target speed
            targetSpeed = GEAR_SPEEDS[currentGear];
            currentSpeed += (targetSpeed - currentSpeed) * 0.05;
        }
        
        // Update rotation
        rotation += currentSpeed;
        drawWheel();
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
}

function shiftGear() {
    if (!canShift || currentGear >= 6) return;
    
    currentGear++;
    canShift = false;
    
    // Reset gear entry time for next gear timing
    gearEntryTime = Date.now();
    
    updateGearDisplay();
    hideShiftPrompt();
    
    const resultDiv = document.getElementById('result');
    if (currentGear === 6) {
        resultDiv.textContent = 'Maximum gear! Fuel depleting...';
    } else {
        resultDiv.textContent = `Shifted to gear ${currentGear}!`;
    }
}

function showShiftPrompt() {
    const shiftBtn = document.getElementById('shiftBtn');
    shiftBtn.classList.remove('hidden');
    shiftBtn.classList.add('pulse');
}

function hideShiftPrompt() {
    const shiftBtn = document.getElementById('shiftBtn');
    shiftBtn.classList.add('hidden');
    shiftBtn.classList.remove('pulse');
}

function updateGearDisplay() {
    document.getElementById('currentGear').textContent = currentGear;
}

function updateFuelBar() {
    const fuelBar = document.getElementById('fuelBar');
    fuelBar.style.width = `${fuelLevel}%`;
    
    // Change color based on fuel level
    if (fuelLevel > 50) {
        fuelBar.style.backgroundColor = '#27ae60';
    } else if (fuelLevel > 25) {
        fuelBar.style.backgroundColor = '#f39c12';
    } else {
        fuelBar.style.backgroundColor = '#e74c3c';
    }
}

function stopSpin() {
    isSpinning = false;
    document.getElementById('spinBtn').disabled = false;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Hide gear and fuel displays
    document.getElementById('gearDisplay').classList.add('hidden');
    document.getElementById('fuelContainer').classList.add('hidden');
    hideShiftPrompt();
    
    // Reset state
    currentGear = 0;
    canShift = false;
    fuelLevel = 100;
    isFuelDepleting = false;
    isSlowingDown = false;
    
    // Calculate winner based on final rotation
    const isClockwise = rotation >= 0;
    const normalizedRotation = (Math.abs(rotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const pointerAngle = Math.PI / 2;
    const adjustedAngle = (pointerAngle + (isClockwise ? normalizedRotation : -normalizedRotation) + 2 * Math.PI) % (2 * Math.PI);
    const anglePerItem = (2 * Math.PI) / items.length;
    const winnerIndex = Math.floor(adjustedAngle / anglePerItem) % items.length;
    
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = `Result: ${items[winnerIndex]}`;
    resultDiv.className = 'result-display';
}

// Remove global window assignment as it's no longer needed
// window.removeItem = removeItem;
