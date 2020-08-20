
var img = new Image(); 

img.addEventListener('load', loadListener, false);

var prevImg = null;
var nextImg = null;

class Label {
    // Training label class defining a box with a classification label.
    static nextLabelId = 0;

    constructor(canvas, imgidx, xi,yi) {
        this.id = Label.nextLabelId++;
        this.labelIndex = imgidx;

        this.xi = this.xf = xi;
        this.yi = this.yf = yi;
        this.width = this.height = 0;

        this.labelInput = $('<input type="text" />');
        this.labelInput.css('position','absolute');
        this.labelInput.css('left',this.xi);
        this.labelInput.css('top',this.yi - 40);
        $(canvas.parentElement).append(this.labelInput)
    }

    draw(ctx) {
        ctx.beginPath();
        this.calculateCoords();
        ctx.rect(this.xi,this.yi,this.width,this.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    calculateCoords() {
        this.width = Math.abs(this.xf-this.xi);
        this.height = Math.abs(this.yf-this.yi);

        this.labelWidth = this.width / img.width;
        this.labelHeight = this.height / img.height;
        this.labelX = (this.xi + this.xf) / (2 * img.width);
        this.labelY = (this.yi + this.yf) / (2 * img.height);
    }
    
    getData() {
        return {
            "labelX": this.labelX,
            "labelY": this.labelY,
            "labelText": this.labelInput.val(),
            "labelWidth": this.labelWidth,
            "labelHeight": this.labelHeight
        }

    }
}

//Canvas
var canvas = document.getElementById('main-canvas');
var ctx = canvas.getContext('2d');
//Labels
var labels = [];
var currLabel = null;
var classLookup = {};
//Variables}
var canvasY = $(canvas).offset().top;
var canvasX = $(canvas).offset().left;
var editBox = false;
//Indices
var prevIdx = 0;
var currIdx = 0;
var nextIdx = 0;
var imgKey = 0;

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
        imgKey = response['currkey'];
        prevIdx = response['previdx'];
        nextIdx = response['nextidx'];

        img.src = apiBaseUrl + '?getimg&key=' + imgKey;
        // if (!useCached) {
        //     img.src = apiBaseUrl + '?getimg&key=' + imgKey;
        // }
    });
    
}

function getClasses() 
{

    $.get(apiBaseUrl + '?getclasses', function(response) {
            for (keyValPair of JSON.parse(response)) {
                classLookup[keyValPair['class']] = keyValPair['index'];
            }

    });
}

function deleteAllLabels() {

    for (label of labels) {
 
        label.labelInput.remove();
    }
    labels = [];
    ctx.drawImage(img,0,0);
}

function nextImage() 
{
    prevImg = img.cloneNode();
    currIdx = nextIdx;
    var useCached = (nextImg != null);
    if  (useCached) {
        deleteAllLabels();

        img = nextImg;
        img.addEventListener('load', loadListener, false);
        ctx.drawImage(img,0,0);   
    }
    
    updateImage(currIdx, useCached);
    
	nextImg = null;
}

function prevImage() 
{
    nextImg = img.cloneNode();
    currIdx = prevIdx;
    var useCached = (prevImg != null);
    if (useCached) {
        deleteAllLabels();

        img = prevImg;
        img.addEventListener('load', loadListener, false);
        ctx.drawImage(img,0,0); 
    }       
    updateImage(currIdx, useCached);
	prevImg = null;
}

function deleteImage() 
{
    // tell lambda to delete img
    $.get(apiBaseUrl + '?delete&key=' + imgKey, nextImage);
}

function saveLabels() 
{
    var labelData = [];
    for (label of labels) {
        labelData.push(label.getData());
    }
    var payload = 
    {
        "action": "savelabels",
        "idx": currIdx,
        "labels": labelData
    };

    $.ajax({
        type: "POST",
        url: apiBaseUrl,
        contentType: "application/json",
        data: JSON.stringify(payload)
    }).done(function(){
        nextImage();
        prevImg = null; 
    });
}

function init() 
{

	$('#next-button').click(nextImage);
	$('#prev-button').click(prevImage);
    $('#delete-button').click(deleteImage);
    $('#save-button').click(saveLabels);
	updateImage(currIdx);
}

$(init);


//Mousedown
$(canvas).on('mousedown', function(e) 
{
    x = parseInt(e.clientX-canvasX);
    y = parseInt(e.clientY-canvasY);
    if (editBox == false) {
        currLabel = new Label(canvas, currIdx, x, y);
        labels.push(currLabel);

    }
    else {
        //give label xf and yf.
        currLabel.xf = x;
        currLabel.yf = y;
        currLabel.calculateCoords();
    }
    editBox = !editBox;
});

//Mousemove
$(canvas).on('mousemove', function(e) 
{
    if(editBox) 
    {
        currLabel.xf = parseInt(e.clientX-canvasX);
        currLabel.yf = parseInt(e.clientY-canvasY);
        ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
        ctx.drawImage(img,0,0);
        for (label of labels) {
            label.draw(ctx);
        }
        
    }

});