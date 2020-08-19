
var img = new Image(); 
img.addEventListener('load', function()
{
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0,0);
}, false);

class Label {
    constructor(canvas, xi,yi) {
        this.xi = this.xf = xi;
        this.yi = this.yf = yi;

        this.labelinput = $('<input type="text" />');
        this.labelinput.css('position','absolute');
        this.labelinput.css('left',this.xi);
        this.labelinput.css('top',this.yi - 40);
        $(canvas.parentElement).append(this.labelinput)
    }

    draw(ctx) {
        ctx.beginPath();
        var width = this.xf-this.xi;
        var height = this.yf-this.yi;
        ctx.rect(this.xi,this.yi,width,height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.stroke();

        
        // ctx.font = "15px Arial";
        // ctx.fillText("Hello World", Math.min(mousex, last_mousex), Math.min(mousey, last_mousey)-4); 

    }

}

//Canvas
var canvas = document.getElementById('main-canvas');
var ctx = canvas.getContext('2d');
//Labels
var labels = {};
currlabel = 0;
//Variables
var canvasx = $(canvas).offset().left;
var canvasy = $(canvas).offset().top;
var last_mousex = last_mousey = 0;
var mousex = mousey = 0;
var editbox = false;
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
    x = parseInt(e.clientX-canvasx);
    y = parseInt(e.clientY-canvasy);
    if (editbox == false) {
        labels.push(new Label(canvas, x, y));
    }
    else {
        label
    }
    editbox = !editbox;
});

//Mousemove
$(canvas).on('mousemove', function(e) 
{
    mousex = parseInt(e.clientX-canvasx);
	mousey = parseInt(e.clientY-canvasy);
    if(editbox) 
    {
        ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
        ctx.drawImage(img,0,0);
        for (label in labels) {
            label.draw(ctx);
        }

        
    }

});