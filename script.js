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
    
    if (value && !items.includes(value)) {
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
        li.innerHTML = `
            <span>${item}</span>
            <button class="delete-btn" onclick="removeItem(${index})">Delete</button>
        `;
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
    
    // The devious part: random duration between 5-10 minutes (300000-600000ms)
    // WARNING: This creates an intentionally extended spinning experience
    // The wheel will take 5-10 minutes to stop, which may frustrate users expecting a quick result
    const totalDuration = 300000 + Math.random() * 300000; // 5-10 minutes
    const startTime = Date.now();
    
    // Speed parameters - this creates the devious behavior
    let currentSpeed = 0.02; // Starting speed
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / totalDuration;
        
        // Devious speed variation pattern
        // The wheel speeds up and slows down multiple times
        const time = elapsed / 1000; // time in seconds
        
        // Create waves of speed ups and slow downs
        const waveFrequency = 0.05; // How often speed changes
        const waveAmplitude = Math.sin(time * waveFrequency) * 0.5 + 0.5; // 0 to 1
        
        // Add random speed bursts
        const randomBurst = Math.sin(time * 0.1 + Math.sin(time * 0.03) * 10) * 0.3 + 0.7;
        
        // Combine different patterns for unpredictable behavior
        const speedMultiplier = (waveAmplitude * 0.7 + randomBurst * 0.3) * (1 - progress * 0.3);
        
        // Base speed increases slowly over time, then decreases near the end
        let baseSpeed;
        if (progress < 0.85) {
            // First 85%: generally speeding up with variations
            baseSpeed = 0.03 + progress * 0.15;
        } else {
            // Last 15%: slowing down to stop
            const endProgress = (progress - 0.85) / 0.15;
            baseSpeed = 0.18 * (1 - endProgress * endProgress);
        }
        
        currentSpeed = baseSpeed * speedMultiplier;
        
        // Update rotation
        rotation += currentSpeed;
        drawWheel();
        
        // Continue or stop
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
    
    // Calculate winner
    const normalizedRotation = (rotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const pointerAngle = Math.PI / 2; // Pointer at top
    const adjustedAngle = (pointerAngle - normalizedRotation + 2 * Math.PI) % (2 * Math.PI);
    const anglePerItem = (2 * Math.PI) / items.length;
    const winnerIndex = Math.floor(adjustedAngle / anglePerItem) % items.length;
    
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = `Result: ${items[winnerIndex]}`;
    resultDiv.className = 'result-display';
}

// Make removeItem available globally
window.removeItem = removeItem;
