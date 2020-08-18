
var img = new Image(); 
img.addEventListener('load', function()
{
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0,0);
}, false);



//Canvas
var canvas = document.getElementById('main-canvas');
var ctx = canvas.getContext('2d');

//Variables
var canvasx = $(canvas).offset().left;
var canvasy = $(canvas).offset().top;
var last_mousex = last_mousey = 0;
var mousex = mousey = 0;
var mousedown = false;
//Indices
var previdx = 0;
var curridx = 0;
var nextidx = 0;
var imgkey = 0;


function updateImage(idx)
{
    $.getJSON(apiBaseUrl + '?getkey&idx=' + idx, function(response)
    {
        imgkey = response['currkey'];
        previdx = response['previdx'];
        nextidx = response['nextidx'];
        
		img.src = apiBaseUrl + '?getimg&key=' + imgkey;
	});
}


function nextImage() 
{
	curridx = nextidx;
	updateImage(curridx);
}

function prevImage() 
{
	curridx = previdx;
	updateImage(curridx);
}

function deleteImage() 
{
// tell lambda to delete img
    $.get(apiBaseUrl + '?delete&key=' + imgkey, function()
    { 
        nextImage();
    });
	
}

function init() 
{

	$('#next-button').click(nextImage);
	$('#prev-button').click(prevImage);
	$('#delete-button').click(deleteImage);
	updateImage(curridx);
}

$(init);




//Mousedown
$(canvas).on('mousedown', function(e) 
{
    last_mousex = parseInt(e.clientX-canvasx);
	last_mousey = parseInt(e.clientY-canvasy);
    mousedown = true;
});

//Mouseup
$(canvas).on('mouseup', function(e) 
{
    mousedown = false;
});

//Mousemove
$(canvas).on('mousemove', function(e) 
{
    mousex = parseInt(e.clientX-canvasx);
	mousey = parseInt(e.clientY-canvasy);
    if(mousedown) 
    {
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