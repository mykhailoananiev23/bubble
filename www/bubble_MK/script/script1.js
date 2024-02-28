// Select the dialog container
const dialogContainer = document.getElementById('dialogContainer');
let offsetX, offsetY;
let isDragging = false;

// Function to handle mouse down event
function handleMouseDown(event) {
    isDragging = false;
    // Get the initial position of the mouse and the dialog container
        offsetX = event.clientX - dialogContainer.offsetLeft;
        offsetY = event.clientY - dialogContainer.offsetTop;
    isDragging = true;
}

// Function to handle mouse up event
function handleMouseUp() {
    isDragging = false;
}
// Function to handle mouse move event
function handleMouseMove(event) {
    // If dragging is enabled, update the position of the dialog container
    if (isDragging) {
        // dialogContainer.style.left = (event.clientX - offsetX) + 'px';
        // dialogContainer.style.top = (event.clientY - offsetY) + 'px';
        dialogContainer.style.left = (event.clientX - offsetX) + 'px';
        dialogContainer.style.top = (event.clientY - offsetY) + 'px';
    }
}
// var bubble= new Bubble(message, anchor, center, edgeColor, backgropundColor, backgroundTexture);

// bubble.show()
function bubble_show(){
    dialogContainer.style.display = 'block';
    // bubble.update({anchor = NewAnchor, center=newCenter, message=newMessage});
}

// Add event listeners for mouse down, mouse move, and mouse up events

// Handle click events for objects
document.querySelectorAll('.object').forEach(object => {
    object.addEventListener('click', function (event) {
        this.addEventListener('mousedown', handleMouseDown);
        this.addEventListener('mousemove', handleMouseMove);

        // Get the name and position of the clicked object
        const objectName = this.name;
        const x = event.clientX;
        const y = event.clientY;

        // Check if the object is on the left side of the screen
        var isLeft = x < window.innerWidth / 2;
        var isTop = y < window.innerHeight / 2;

        // Show the appropriate dialog image based on object position
        const dialogImage = document.getElementById('dialogImage');
        dialogContainer.style.display = 'block';
        dialogContainer.style.left = x + 'px';
        dialogContainer.style.top = y + 'px';
        dialogImage.src = isLeft ? (isTop ? './bubble/bubble_lefttop1.png' : './bubble/bubble_leftdown1.png') : (isTop ? './bubble/bubble_righttop1.png' : './bubble/bubble_rightdown1.png');
        dialogContainer.style.top = isLeft ? (isTop ? y : y-dialogImage.offsetHeight) +'px': (isTop ? y :  y- dialogImage.offsetHeight)+'px';
        dialogContainer.style.left = isLeft ? (isTop ? x : x) +'px': (isTop ?x -dialogImage.offsetWidth :  x  -dialogImage.offsetWidth)+'px';


        // Set the text in the dialog
        document.getElementById('dialogText').innerText = objectName;
    });
    this.addEventListener('mouseup', handleMouseUp);

});
