
/**   
 * Contains a bounding box and an HTML input element
 * for classifying objects in images.
 */
class Label {

    constructor(canvas, imgidx, xi, yi) {
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
            labels.splice(labels.indexOf(label),1);
            updateCanvas();
        });

        this.dropDown = $('<select></select>');
        for (var className in classLookup) {
            var optionTag = '<option value="' + classLookup[className] + '">' + className + '</option>';
            this.dropDown.append(optionTag);

        }

        this.toolBar = $('<div class="toolbar"></div>');
        this.toolBar.css('position','absolute');
        this.toolBar.css('left', this.canvasToToolbarX(this.xi));
        this.toolBar.css('top', this.canvasToToolbarY(this.yi));
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

        this.toolBar.css('left', this.canvasToToolbarX(leftX));
        this.toolBar.css('top', this.canvasToToolbarY(topY));
    }

    canvasToToolbarX(canvasX)
    {
        var xScale = canvas.width / canvas.getBoundingClientRect().width;
        return parseInt(canvasX/xScale);
    }

    canvasToToolbarY(canvasY)
    {
        var yScale = canvas.height / canvas.getBoundingClientRect().height;
        return parseInt((canvasY - 40)/yScale);
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
var editBox = false;
//Labels
var labels = [];
var currLabel = null;
var classLookup = {};

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

        $('button').prop('disabled', true);
    }

    var cachedImg = imgCache[idx];
    var useCached = (cachedImg != null);

    $.getJSON(apiBaseUrl + '?getkey&idx=' + idx, function(response)
    {
        imgMetadata = response;

        $('button').prop('disabled', false);

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

function clientToCanvasX(clientX)
{
    var xScale = canvas.width / canvas.getBoundingClientRect().width;
    return parseInt((clientX - canvas.getBoundingClientRect().left) * xScale);
}

function clientToCanvasY(clientY)
{
    var yScale = canvas.height / canvas.getBoundingClientRect().height;
    return parseInt((clientY - canvas.getBoundingClientRect().top) * yScale);
}

function canvasToClientX(canvasX)
{
    var xScale = canvas.width / canvas.getBoundingClientRect().width;
    return parseInt(canvasX/xScale - canvas.getBoundingClientRect().left);
}

function canvasToClientY(canvasY)
{
    var yScale = canvas.height / canvas.getBoundingClientRect().height;
    return parseInt(canvasY/yScale + canvas.getBoundingClientRect().top);
}

// Handles the creation/finalization of Label objects
$(canvas).on('mousedown', function(e) 
{
    switch (e.which) 
    {
        case 1:
            var x = clientToCanvasX(e.clientX);
            var y = clientToCanvasY(e.clientY);

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
        currLabel.xf = clientToCanvasX(e.clientX);
        currLabel.yf = clientToCanvasY(e.clientY);

        currLabel.calculateCoords();

        updateCanvas();
        
    }

});

////////////////////////////// Initialization //////////////////////////////

function init() 
{
    if(window.location.search != "")
    {
        var awsAuthCode = window.location.search.match('code=(.*)')[1];
        
        var awsParams = {
            grant_type: 'authorization_code',
            code: awsAuthCode,
            client_id: '2skls43lghre9ori0a0u7b0rcc',
            redirect_uri: 'https://catcam.hackett.io'
        };


        $.post('https://catcam.auth.us-west-2.amazoncognito.com/oauth2/token', awsParams, function(response) {

            $.ajaxSetup({'headers' : {'authorization': response.id_token}});

        });
    }

	$('#next-button').click(nextImage);
	$('#prev-button').click(prevImage);
    $('#delete-button').click(deleteImage);
    $('#save-button').click(saveLabels);
    
    window.addEventListener('resize', updateCanvas);

    getClasses();
	updateImage(0);
}


$(init);