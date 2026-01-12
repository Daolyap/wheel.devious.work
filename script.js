// Wheel application
let items = [];
let isSpinning = false;
let rotation = 0;
let animationFrameId = null;

// Canvas setup
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const radius = 240;

// Spin duration constants (in milliseconds)
const MIN_SPIN_DURATION = 300000; // 5 minutes
const MAX_SPIN_DURATION = 600000; // 10 minutes

// Speed variation constants
const WAVE_FREQUENCY_PRIMARY = 0.05;
const WAVE_FREQUENCY_SECONDARY = 0.1;
const WAVE_FREQUENCY_TERTIARY = 0.03;
const WAVE_MODULATION_FACTOR = 10;
const PRIMARY_WEIGHT = 0.7;
const SECONDARY_WEIGHT = 0.3;
const PROGRESS_DAMPING = 0.3;
const ACCELERATION_PHASE_END = 0.85;
const BASE_SPEED_MIN = 0.03;
const BASE_SPEED_ACCELERATION = 0.15;
const BASE_SPEED_MAX = 0.18;

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
    document.getElementById('spinBtn').disabled = true;
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = 'Spinning...';
    resultDiv.className = 'result-display spinning';
    
    const totalDuration = MIN_SPIN_DURATION + Math.random() * (MAX_SPIN_DURATION - MIN_SPIN_DURATION);
    const startTime = Date.now();
    
    let currentSpeed = 0.02;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / totalDuration;
        
        const time = elapsed / 1000;
        
        // Complex speed variation using multiple sine wave patterns
        const waveAmplitude = Math.sin(time * WAVE_FREQUENCY_PRIMARY) * 0.5 + 0.5;
        const randomBurst = Math.sin(time * WAVE_FREQUENCY_SECONDARY + Math.sin(time * WAVE_FREQUENCY_TERTIARY) * WAVE_MODULATION_FACTOR) * SECONDARY_WEIGHT + PRIMARY_WEIGHT;
        const speedMultiplier = (waveAmplitude * PRIMARY_WEIGHT + randomBurst * SECONDARY_WEIGHT) * (1 - progress * PROGRESS_DAMPING);
        
        // Progressive speed adjustment throughout spin duration
        let baseSpeed;
        if (progress < ACCELERATION_PHASE_END) {
            baseSpeed = BASE_SPEED_MIN + progress * BASE_SPEED_ACCELERATION;
        } else {
            const endProgress = (progress - ACCELERATION_PHASE_END) / (1 - ACCELERATION_PHASE_END);
            baseSpeed = BASE_SPEED_MAX * (1 - endProgress * endProgress);
        }
        
        currentSpeed = Math.max(0, baseSpeed * speedMultiplier);
        
        // Update rotation with periodic normalization
        rotation += currentSpeed;
        rotation = rotation % (2 * Math.PI);
        drawWheel();
        
        if (elapsed < totalDuration) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            stopSpin();
        }
    }
    
    animate();
}

function stopSpin() {
    isSpinning = false;
    document.getElementById('spinBtn').disabled = false;
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Calculate winner based on final rotation
    const normalizedRotation = (Math.abs(rotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const pointerAngle = Math.PI / 2;
    const isClockwise = rotation >= 0;
    const adjustedAngle = (pointerAngle + (isClockwise ? normalizedRotation : -normalizedRotation) + 2 * Math.PI) % (2 * Math.PI);
    const anglePerItem = (2 * Math.PI) / items.length;
    const winnerIndex = Math.floor(adjustedAngle / anglePerItem) % items.length;
    
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = `Result: ${items[winnerIndex]}`;
    resultDiv.className = 'result-display';
}

// Remove global window assignment as it's no longer needed
// window.removeItem = removeItem;
