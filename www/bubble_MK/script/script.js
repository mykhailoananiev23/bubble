// Select the dialog container
const dialogContainer = document.getElementById('dialogContainer');
let offsetX, offsetY;
let isDragging = false;

// Function to handle mouse down event
function handleMouseDown(event) {
    isDragging = true;
    // Get the initial position of the mouse and the dialog container
    offsetX = event.clientX - dialogContainer.offsetLeft;
    offsetY = event.clientY - dialogContainer.offsetTop;
}
function bubble_show() {
    dialogContainer.style.display = 'block';
    // bubble.update({anchor = NewAnchor, center=newCenter, message=newMessage});
}

// Function to handle mouse move event
function handleMouseMove(event) {
    const x = event.clientX;
    const y = event.clientY;
    var isLeft = x < window.innerWidth / 2;
    var isTop = y < window.innerHeight / 2;
    if (isDragging) {
        // Update the position of the dialog container
        dialogContainer.style.left = (event.clientX - offsetX) + 'px';
        dialogContainer.style.top = (event.clientY - offsetY) + 'px';
        document.getElementById('dialogText').innerText = "X: "+x+" , Y: "+y;
        const dialogImage = document.getElementById('dialogImage');
        dialogImage.src = isLeft ? (isTop ? './img/bubble_lefttop1.png' : './img/bubble_leftdown1.png') : (isTop ? './img/bubble_righttop1.png' : './img/bubble_rightdown1.png');

        document.addEventListener('mouseup', handleMouseUp);
    }
}

// Function to handle mouse up event
function handleMouseUp() {
    isDragging = false;
}
function dialogcancal(){
    dialogContainer.style.display = 'none';

}
// Add event listener for mouse move on the document
document.addEventListener('mousemove', handleMouseMove);

// Handle click events for objects
document.querySelectorAll('.object').forEach(object => {
    object.addEventListener('mousedown', function (event) {
       

        // Call the handleMouseDown function when the object is clicked down
        handleMouseDown(event);
    });
});

// Add event listener for mouse up on the document
document.addEventListener('mouseup', handleMouseUp);
