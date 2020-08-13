
var idx = 0;

var img = new Image(); 
img.addEventListener('load', function() {
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0,0);
}, false);
img.src = getImageSource(idx);


//Canvas
var canvas = document.getElementById('main-canvas');
var ctx = canvas.getContext('2d');

//Variables
var canvasx = $(canvas).offset().left;
var canvasy = $(canvas).offset().top;
var last_mousex = last_mousey = 0;
var mousex = mousey = 0;
var mousedown = false;

function getImageSource(imgidx) {
	return apiBaseUrl + '?idx=' + imgidx;
}

function nextImage() {

	idx += 1;
	img.src = getImageSource(idx);

}

function prevImage() {

	idx -=1;
	img.src = getImageSource(idx);
}

function init() {

	$('#next-button').click(nextImage);
	$('#prev-button').click(prevImage);
}

$(init);




//Mousedown
$(canvas).on('mousedown', function(e) {
    last_mousex = parseInt(e.clientX-canvasx);
	last_mousey = parseInt(e.clientY-canvasy);
    mousedown = true;
});

//Mouseup
$(canvas).on('mouseup', function(e) {
    mousedown = false;
});

//Mousemove
$(canvas).on('mousemove', function(e) {
    mousex = parseInt(e.clientX-canvasx);
	mousey = parseInt(e.clientY-canvasy);
    if(mousedown) {
        ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
        ctx.drawImage(img,0,0);
        ctx.beginPath();
        var width = mousex-last_mousex;
        var height = mousey-last_mousey;
        ctx.rect(last_mousex,last_mousey,width,height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
    //Output
    $('#output').html('current: '+mousex+', '+mousey+'<br/>last: '+last_mousex+', '+last_mousey+'<br/>mousedown: '+mousedown);
});