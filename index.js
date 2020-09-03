
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
            currLabel = null;
            editBox = false;
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
        for (var className in api.classLookup) {
            var optionTag = '<option value="' + api.classLookup[className] + '">' + className + '</option>';
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

        var img = api.imgCache[api.imgMetadata['curr']['idx']];

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



//Canvas
var canvas = document.getElementById('main-canvas');
var ctx = canvas.getContext('2d');
var editBox = false;
//Labels
var labels = [];
var currLabel = null;


function loadListener() {deleteAllLabels();}

api.imageLoadListeners.push(loadListener);



function deleteAllLabels() {

    for (label of labels) {
 
        label.toolBar.remove();
    }
    labels = [];
    ctx.drawImage(api.imgCache[api.imgMetadata['curr']['idx']],0,0);
}

function saveLabels() 
{
    api.imgCache[api.imgMetadata['curr']['idx']] = null;

    var labelData = [];
    for (label of labels) {
        labelData.push(label.getData());
    }
    var payload = 
    {
        "action": "savelabels",
        "idx": api.imgMetadata['curr']['idx'],
        "labels": labelData
    };

    api.postJSON(payload).done(api.nextImage);
}

function updateCanvas(mouseX, mouseY) 
{
    ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
    ctx.drawImage(api.imgCache[api.imgMetadata['curr']['idx']],0,0);

    for (label of labels) 
    {
        label.draw(ctx);
    }

    ctx.lineWidth = 1.0;
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "#CCCCCC";
    
    ctx.beginPath();

    ctx.moveTo(0, mouseY);
    ctx.lineTo(canvas.width, mouseY);

    ctx.moveTo(mouseX, 0);
    ctx.lineTo(mouseX, canvas.height);

    ctx.stroke();

    ctx.setLineDash([]);
    
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
                // Redraw image so older labels are not in the way.
                ctx.clearRect(0,0,canvas.width,canvas.height); 
                ctx.drawImage(api.imgCache[api.imgMetadata['curr']['idx']],0,0);

                currLabel = new Label(canvas, api.imgMetadata['curr']['idx'], x, y);
                labels.push(currLabel);
            }
            else {
                //give label xf and yf.
                currLabel.xf = x;
                currLabel.yf = y;
                currLabel.calculateCoords();
                // Draw existing labels.
                for (label of labels) 
                {
                    label.draw(ctx);
                }
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
    var mouseCanvasX = clientToCanvasX(e.clientX);
    var mouseCanvasY = clientToCanvasY(e.clientY);

    if(editBox) 
    {
        currLabel.xf = mouseCanvasX;
        currLabel.yf = mouseCanvasY;

        currLabel.calculateCoords();
    }

    updateCanvas(mouseCanvasX, mouseCanvasY);

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


        $.post('https://catcam.auth.us-west-2.amazoncognito.com/oauth2/token', awsParams, function(response) 
        {

            $.ajaxSetup({'headers' : {'Authorization': response.id_token}});

            $('#login-button').replaceWith('<button type="button" class="btn btn-block btn-secondary" disabled>Logged In</button>');

            api.getClasses();
            api.updateImage(0);
        });
    }

	$('#next-button').click(api.nextImage);
	$('#prev-button').click(api.prevImage);
    $('#delete-button').click(api.deleteImage);
    $('#save-button').click(saveLabels);
    
    window.addEventListener('resize', updateCanvas);
}


$(init);