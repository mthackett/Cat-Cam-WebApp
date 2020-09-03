var api = {};

api.baseUrl = 'https://cqzbiz8jyd.execute-api.us-west-2.amazonaws.com/prod';

api.imgCache = {};

//Indices and keys for the main and cached images
api.imgMetadata = {
    'prev': {'idx': 0, 'key': ''},
    'curr': {'idx': 0, 'key': ''},
    'next': {'idx': 0, 'key': ''}
};

api.lockMetadata = false;

api.imageLoadListeners = [];

/**
 * Called whenever the main image finishes loading
 */
api.loadListener = function(event = null)
{
    if(event == null || event.target.attributes['idx'] == api.imgMetadata['curr']['idx'])
    {
        var img = api.imgCache[api.imgMetadata['curr']['idx']];

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0,0);
        for (listener of api.imageLoadListeners) 
        {
            listener();
        }
    }
}

api.loadAndCacheImage = function(metadata)
{
    api.imgCache[metadata['idx']] = new Image();
    api.imgCache[metadata['idx']].attributes['idx'] = metadata['idx'];
    api.imgCache[metadata['idx']].addEventListener('load', api.loadListener);

    fetch(api.baseUrl + '?getimg&key=' + metadata['key'], { headers: { 'Authorization': $.ajaxSettings.headers.Authorization } })
    .then(res => res.blob())
    .then(blob => {
        api.imgCache[metadata['idx']].src = URL.createObjectURL(blob);
    });
}

/**
 * Updates api.imgMetadata and loads the image corresponding to the provided image index
 * 
 * @param {number} idx The index of the image to load
 */
api.updateImage = function(idx)
{
    if(api.lockMetadata)
    {
        return;
    }
    else
    {
        api.lockMetadata = true;

        $('button').prop('disabled', true);
    }

    var cachedImg = api.imgCache[idx];
    var useCached = (cachedImg != null);

    $.getJSON(api.baseUrl + '?getkey&idx=' + idx, function(response)
    {
        api.imgMetadata = response;

        $('button').prop('disabled', false);

        if(useCached && cachedImg.complete) api.loadListener();

        for(var metadataKey in api.imgMetadata)
        {
            metadata = api.imgMetadata[metadataKey];

            if((metadata['idx'] != 0) && (api.imgCache[metadata['idx']] == null))
            {
                api.loadAndCacheImage(metadata);
            }
        }

        api.lockMetadata = false;
    });
}

api.nextImage = function() 
{
    api.updateImage(api.imgMetadata['next']['idx']);
}

api.prevImage = function() 
{
    api.updateImage(api.imgMetadata['prev']['idx']);
}

/**
 * Permanently deletes the currently displayed image from the database.
 */
api.deleteImage = function() 
{
    api.imgCache[api.imgMetadata['curr']['idx']] = null;
    
    $.get(api.baseUrl + '?delete&key=' + api.imgMetadata['curr']['key'], api.nextImage);
}

api.classLookup = {};

/**
 * Retrieves the available class labels from the server and
 * creates a mapping from each class name to its label index
 */
api.getClasses = function() 
{
    $.get(api.baseUrl + '?getclasses', function(response) {
            for (keyValPair of response) {
                api.classLookup[keyValPair['class']] = keyValPair['index'];
            }

    });
}

api.postJSON = function(payload) 
{
    return $.ajax({
        type: "POST",
        url: api.baseUrl,
        contentType: "application/json",
        data: JSON.stringify(payload)
    });
}





