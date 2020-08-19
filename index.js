
var img = new Image(); 

img.addEventListener('load', loadListener, false);

var previmg = null;
var nextimg = null;

class Label {
    
    static nextLabelId = 0;

    constructor(canvas, xi,yi) {
        this.xi = this.xf = xi;
        this.yi = this.yf = yi;
        this.id = Label.nextLabelId++;

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
    }

}

//Canvas
var canvas = document.getElementById('main-canvas');
var ctx = canvas.getContext('2d');
//Labels
var labels = {};
currlabel = null;
//Variables
var canvasx = $(canvas).offset().left;
var canvasy = $(canvas).offset().top;
var editbox = false;
//Indices
var previdx = 0;
var curridx = 0;
var nextidx = 0;
var imgkey = 0;

function loadListener()
{
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0,0);
    deleteAllLabels();
}


function updateImage(idx, useCached=false)
{
    $.getJSON(apiBaseUrl + '?getkey&idx=' + idx, function(response)
    {
        imgkey = response['currkey'];
        previdx = response['previdx'];
        nextidx = response['nextidx'];

        if (!useCached) {
            img.src = apiBaseUrl + '?getimg&key=' + imgkey;
        }
    });
    
}

function deleteAllLabels() {

    for (id in labels) {
        // delete labels[id]
        labels[id].labelinput.remove();
    }
    labels = {};
    ctx.drawImage(img,0,0);
}

function nextImage() 
{
    previmg = img.cloneNode();
    curridx = nextidx;
    var useCached = (nextimg != null);
    if  (useCached) {
        deleteAllLabels();

        img = nextimg;
        img.addEventListener('load', loadListener, false);
        ctx.drawImage(img,0,0);   
    }
    
    updateImage(curridx, useCached);
    
	nextimg = null;
}

function prevImage() 
{
    nextimg = img.cloneNode();
    curridx = previdx;
    var useCached = (previmg != null);
    if (useCached) {
        deleteAllLabels();

        img = previmg;
        img.addEventListener('load', loadListener, false);
        ctx.drawImage(img,0,0); 
    }       
    updateImage(curridx, useCached);
	previmg = null;
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
        currlabel = new Label(canvas, x, y);
        labels[currlabel.id] = currlabel;

    }
    else {
        //give label xf and yf.
        // labels[]
        currlabel.xf = x;
        currlabel.yf = y;
    }
    editbox = !editbox;
});

//Mousemove
$(canvas).on('mousemove', function(e) 
{
    if(editbox) 
    {
        currlabel.xf = parseInt(e.clientX-canvasx);
        currlabel.yf = parseInt(e.clientY-canvasy);
        ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
        ctx.drawImage(img,0,0);
        for (id in labels) {
            labels[id].draw(ctx);
        }
        
    }

});