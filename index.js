
/**   
 * Contains a bounding box and an HTML input element
 * for classifying objects in images.
 */
class Label {

    constructor(canvas, imgidx, xi,yi) {
        this.labelIndex = imgidx;

        this.xi = this.xf = xi;
        this.yi = this.yf = yi;
        this.width = this.height = 0;

        this.editButton = $('<button type="button">Edit</button>'); 
        this.editButton.click(this, function(event) {
            currLabel = event.data;
            editBox = true;
        });
        $(canvas.parentElement).append(this.editButton);


        this.deleteButton = $('<button type="button">Del</button>'); //glyphicon glyphicon-remove
        this.deleteButton.click(this, function(event) {
            // delete this label.
            var label = event.data;
            label.toolBar.remove();
            var idx = 0;
            for (var i = 0; i < labels.length; i++) {
                if (labels[i] == label) {
                    idx = i;
                    break;
                }
            }
            labels.splice(i,1);
            updateCanvas();
        });

        this.dropDown = $('<select></select>');
        for (var className in classLookup) {
            var optionTag = '<option value="' + classLookup[className] + '">' + className + '</option>';
            this.dropDown.append(optionTag);

        }


        this.toolBar = $('<div class="toolbar"></div>');
        this.toolBar.css('position','absolute');
        this.toolBar.css('left',this.xi);
        this.toolBar.css('top',this.yi - 40);
        $(this.toolBar).append(this.dropDown);
        $(this.toolBar).append(this.editButton);
        $(this.toolBar).append(this.deleteButton);

        $(canvas.parentElement).append(this.toolBar);

    }

    draw(ctx) {
        ctx.beginPath();
        this.calculateCoords();
        ctx.rect(this.xi,this.yi,this.width,this.height);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    calculateCoords() {
        var leftX = Math.min(this.xi, this.xf);
        var topY = Math.min(this.yi, this.yf);

        this.width = this.xf-this.xi;
        this.height = this.yf-this.yi;

        var img = imgCache[imgMetadata['curr']['idx']];

        this.labelWidth = this.width / img.width;
        this.labelHeight = this.height / img.height;
        this.labelX = (this.xi + this.xf) / (2 * img.width);
        this.labelY = (this.yi + this.yf) / (2 * img.height);

        this.toolBar.css('left',leftX);
        this.toolBar.css('top',topY - 40);
    }
    
    /**
     * Returns an object containing YOLO-style properties 
     * of the bounding box and its corresponding label.
     */
    getData() {
        return {
            "labelX": this.labelX,
            "labelY": this.labelY,
            "labelIndex": this.dropDown.val(), 
            "labelWidth": Math.abs(this.labelWidth),
            "labelHeight": Math.abs(this.labelHeight)
        }

    }
}

var imgCache = {};

//Indices and keys for the main and cached images
var imgMetadata = {
    'prev': {'idx': 0, 'key': ''},
    'curr': {'idx': 0, 'key': ''},
    'next': {'idx': 0, 'key': ''}
};

var lockMetadata = false;

//Canvas
var canvas = document.getElementById('main-canvas');
var ctx = canvas.getContext('2d');
//Labels
var labels = [];
var currLabel = null;
var classLookup = {};
//Variables
var canvasY = $(canvas).offset().top;
var canvasX = $(canvas).offset().left;
var editBox = false;

/**
 * Called whenever the main image finishes loading
 */
function loadListener(event = null)
{
    if(event == null || event.target.attributes['idx'] == imgMetadata['curr']['idx'])
    {
        var img = imgCache[imgMetadata['curr']['idx']];

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0,0);
        deleteAllLabels();
    }
}

function cacheImage(img, idx)
{
    imgCache[idx] = img.cloneNode();
}

function loadAndCacheImage(metadata)
{
    imgCache[metadata['idx']] = new Image();
    imgCache[metadata['idx']].attributes['idx'] = metadata['idx'];
    imgCache[metadata['idx']].addEventListener('load', loadListener)
    imgCache[metadata['idx']].src = apiBaseUrl + '?getimg&key=' + metadata['key'];
}

/**
 * Updates imgMetadata and loads the image corresponding to the provided image index
 * 
 * @param {number} idx The index of the image to load
 */
function updateImage(idx)
{
    if(lockMetadata)
    {
        return;
    }
    else
    {
        lockMetadata = true;

        $('#next-button').prop('disabled', true);
        $('#prev-button').prop('disabled', true);
    }

    var cachedImg = imgCache[idx];
    var useCached = (cachedImg != null);

    $.getJSON(apiBaseUrl + '?getkey&idx=' + idx, function(response)
    {
        imgMetadata = response;

        $('#next-button').prop('disabled', false);
        $('#prev-button').prop('disabled', false);

        if(useCached && cachedImg.complete) loadListener();

        for(var metadataKey in imgMetadata)
        {
            metadata = imgMetadata[metadataKey];

            if((metadata['idx'] != 0) && (imgCache[metadata['idx']] == null))
            {
                loadAndCacheImage(metadata);
            }
        }

        lockMetadata = false;
    });
}

/**
 * Retrieves the available class labels from the server and
 * creates a mapping from each class name to its label index
 */
function getClasses() 
{
    $.get(apiBaseUrl + '?getclasses', function(response) {
            for (keyValPair of response) {
                classLookup[keyValPair['class']] = keyValPair['index'];
            }

    });
}

function deleteAllLabels() {

    for (label of labels) {
 
        label.toolBar.remove();
    }
    labels = [];
    ctx.drawImage(imgCache[imgMetadata['curr']['idx']],0,0);
}

function nextImage() 
{
    updateImage(imgMetadata['next']['idx']);
}

function prevImage() 
{
    updateImage(imgMetadata['prev']['idx']);
}

/**
 * Permanently deletes the currently displayed image from the database.
 */
function deleteImage() 
{
    imgCache[imgMetadata['curr']['idx']] = null;
    
    $.get(apiBaseUrl + '?delete&key=' + imgMetadata['curr']['key'], nextImage);
}

function saveLabels() 
{
    imgCache[imgMetadata['curr']['idx']] = null;

    var labelData = [];
    for (label of labels) {
        labelData.push(label.getData());
    }
    var payload = 
    {
        "action": "savelabels",
        "idx": imgMetadata['curr']['idx'],
        "labels": labelData
    };

    $.ajax({
        type: "POST",
        url: apiBaseUrl,
        contentType: "application/json",
        data: JSON.stringify(payload)
    }).done(nextImage);
}

function updateCanvas() 
{
    ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
    ctx.drawImage(imgCache[imgMetadata['curr']['idx']],0,0);
    for (label of labels) {
        label.draw(ctx);
    }
}

////////////////////////////// Canvas Drawing //////////////////////////////

// Handles the creation/finalization of Label objects
$(canvas).on('mousedown', function(e) 
{
    switch (e.which) {
        case 1:
            x = parseInt(e.clientX-canvasX);
            y = parseInt(e.clientY-canvasY);
            if (editBox == false) {
                currLabel = new Label(canvas, imgMetadata['curr']['idx'], x, y);
                labels.push(currLabel);
            }
            else {
                //give label xf and yf.
                currLabel.xf = x;
                currLabel.yf = y;
                currLabel.calculateCoords();
            }
            break;

        case 2:
            //middle click
            break;
        
        case 3:
            //right click
            
            break;

    }
    
    editBox = !editBox;
});

// Redraws the canvas if the user is currently editing the bounds of a Label.
$(canvas).on('mousemove', function(e) 
{
    if(editBox) 
    {
        currLabel.xf = parseInt(e.clientX-canvasX);
        currLabel.yf = parseInt(e.clientY-canvasY);
        currLabel.calculateCoords();

        updateCanvas();
        
    }

});

////////////////////////////// Initialization //////////////////////////////

function init() 
{

	$('#next-button').click(nextImage);
	$('#prev-button').click(prevImage);
    $('#delete-button').click(deleteImage);
    $('#save-button').click(saveLabels);

    getClasses();
	updateImage(0);
}


$(init);