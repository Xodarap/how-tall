/*!
 * Start Bootstrap - Creative Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */
const cipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);

    return text => text.split('')
        .map(textToChars)
        .map(applySaltToChar)
        .map(byteHex)
        .join('');
}

const decipher = salt => {
    const textToChars = text => text.split('').map(c => c.charCodeAt(0));
    const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
    return encoded => encoded.match(/.{1,2}/g)
        .map(hex => parseInt(hex, 16))
        .map(applySaltToChar)
        .map(charCode => String.fromCharCode(charCode))
        .join('');
}

window.ben = {};

(function($) {
    "use strict"; // Start of use strict

    // jQuery for page scrolling feature - requires jQuery Easing plugin
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 51
    })

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Fit Text Plugin for Main Header
    $("h1").fitText(
        1.2, {
            minFontSize: '35px',
            maxFontSize: '65px'
        }
    );

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 100
        }
    })

    // Initialize WOW.js Scrolling Animations
    new WOW().init();

    var validateImage = function() {
        var files = $('#photo')[0].files;
        if(!files || files.length == 0){            
            $('#photoError').show();
            return false;
        }
        if(files[0].type.slice(0,6) !== 'image/'){
            $('#photoError').show();
            return false;        
        }
        $('#photoError').hide();
        return true;
    }

    $('#photo').on('change', function(){        
        if(!validateImage()){
            return;
        }

        var reader = new FileReader();
        reader.onloadend = function(event) {
            $('#preview').attr('src', event.target.result);

            var img = new Image();
            $(img).on('load', function(imgEvent) {
                var ratio = img.naturalHeight / img.naturalWidth;
                img.height = img.naturalHeight;
                img.width = img.naturalWidth;
            });
            img.src = event.target.result;
            resizeImage($('#photo')[0].files[0], (a,b) => {})
        }
        var files = $('#photo')[0].files;
        if(files && files.length > 0){
            //$('#preview').show();
            reader.readAsDataURL(files[0]);
        } 
    })

    var validate = function () {
        return validateImage();
    }
    
    $('#photo').on('blur', validate);

    var resizeImage = function(file, cb) {
        var img = document.createElement("img");
        var reader = new FileReader();  
        reader.onload = function(e) {
            img.src = e.target.result;
            var canvas = $('#myCanvas')[0] //document.createElement('canvas');
            //canvas.style.display = 'none';
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);

            var MAX_WIDTH = 224;
            var MAX_HEIGHT = 300;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            img.width = canvas.width;
            img.height = canvas.height;

            cb(canvas, e.target.result);
        }
        reader.readAsDataURL(file);
    };

    var identifyDrink = function(drinks) {
        var match = c => drinks.filter(x => x.name == c).length > 0;
        if(match('beer') && match('bottle')) { return 'beer bottle'; }
        if(match('soda') && match('bottle')) { return 'soda bottle'; }
        if(match('coffee') && match('cup')) { return 'coffee cup'; }
        if(match('tea') && match('cup')) { return 'tea cup'; }
        if(match('cup')) { return 'cup'; }
        if(match('mug')) { return 'mug'; }
        return 'generic drink';
    }

    var drawBox = function(ctx, canvas, bb, color) {
        ctx.beginPath();
        var l = bb.left_col * canvas.width;
        var r = bb.right_col * canvas.width;
        var t = bb.top_row * canvas.height;
        var b = bb.bottom_row * canvas.height;
        ctx.rect(l, t, r-l, b-t);
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    var drawBoxes = function(result) {
        var regions = result.results[0].outputs[1].data.regions;
        var canvas = $('#myCanvas')[0]
        var ctx = canvas.getContext("2d")
        var personTitles = ['woman', 'man', 'guy', 'person'];
        var drinkTitles = ['drink', 'icee', 'water', 'bottle', 'can', 'beer', 'soda',
                            'cup', 'coffee', 'tea', 'mug'];

        var regionMatch = titles => region => region.data.concepts.filter(x=> titles.includes(x.name)).length > 0
        var drinkRegions = regions.filter(regionMatch(drinkTitles));
        var personRegions = regions.filter(regionMatch(personTitles));
        var drinksOnly = drinkRegions.filter(x => !personRegions.includes(x));
        var personOnly = personRegions.filter(x => !drinkRegions.includes(x));
        var both = personRegions.filter(x => drinkRegions.includes(x));
        var results = {};

        if(drinksOnly.length == 0 && personOnly.length == 0 &&
            both.length >= 2) {
            // Use smaller one for drink
            var bb1 = both[0].region_info.bounding_box;
            var bb2 = both[0].region_info.bounding_box;

            var bb1_height = bb1.bottom_row - bb1.top_row;
            var bb2_height = bb2.bottom_row - bb2.top_row;
            if(bb1_height < bb2_height) {
                drinksOnly = [both[0]];
                personOnly = [both[1]];
            } else {
                drinksOnly = [both[1]];
                personOnly = [both[0]];
            }
        } else if (drinksOnly.length == 0 && both.length > 0 &&
            personRegions.length > 1) {
                drinksOnly = [both[0]];
                personOnly = personRegions.filter(x => x != both[0])
        } else if (personOnly.length == 0 && both.length > 0 &&
            drinkRegions.length > 1) {
                personOnly = [both[0]];
                drinksOnly = drinkRegions.filter(x => x != both[0])
        }

        if(drinksOnly.length > 0) {
            var bb = drinksOnly[0].region_info.bounding_box;
            results.drink = bb.bottom_row - bb.top_row;
            var length_diff = bb.right_col - bb.left_col;
            // assume it's horizontal
            if(length_diff > results.drink) {
                results.drink = length_diff;
            }
            var drinks = drinksOnly[0].data.concepts.filter(x => $.inArray(x.name, drinkTitles) >= 0);
            results.drink_type = identifyDrink(drinks);
            drawBox(ctx, canvas, bb, 'red');
        }

        if(personOnly.length > 0) {            
            var bb = personOnly[0].region_info.bounding_box;
            results.person = bb.bottom_row - bb.top_row;
            drawBox(ctx, canvas, bb, 'blue');
        }
        return results;
    };
    var heightDictionary = {'beer bottle': 9, 'generic drink': 6.25, 'soda bottle': 8,
    'coffee cup': 4.5, 'tea cup': 4.5, 'cup': 4.5, 
    'mug': 4, 'stubby': 6.25, 'long neck': 9, 'bomber': 11,
    'mini growler': 9, 'growler': 11, 'Corona': 9.5, 'Rouge Dead Guy Ale': 9.204,
    'Pacifico': 9.579, 'Stone Ruination': 11.117, 'Shock Top': 9};

    var heightDifference = function(boxes) {
        var drink = boxes.drink;
        var person = boxes.person;
        var ratio = person / drink;
        window.ben.ratio = ratio;

        var drink_height = heightDictionary[boxes.drink_type]
        return heightCalculations(ratio, drink_height);
    }

    var heightCalculations = function(ratio, drink_height) {
        var inches = drink_height * ratio;
        var feet = Math.floor(inches / 12);
        inches %= 12;
        return {ratio: ratio, feet: feet, inches: inches, drink_height: drink_height}
    }

    var displayResults = function(d, r) {
        if(!isNaN(d.ratio)) {
            $('#resultText').text(
                'I believe this person is holding a ' + r.drink_type + ' which I am assuming to be ' + d.drink_height + ' inches tall. ' +
                'This person is ' + d.ratio.toFixed(2) + ' times taller than the drink, implying a height of ' +
                d.feet + "'" + Math.floor(d.inches) + '".'
            )
        } else if (r.drink === undefined) {            
            $('#resultText').text('Error: Could not find a drink');
        } else if (r.person === undefined) {            
            $('#resultText').text('Error: Could not find a person');
        }
    }

    $('#drinkType').change(event => {
        var drink_height = heightDictionary[$('#drinkType').val()];
        var d = heightCalculations(window.ben.ratio, drink_height);
        var r = {
            drink_type: $('#drinkType').val()
        }
        displayResults(d, r);
    })
    $('#ratingForm').submit(function(event){
        event.preventDefault();
        if(!validate()) {
            return;
        }

        $('#loaderHolder').show();
        var file = $('#photo')[0].files[0];
        var after = function(canvas, result) {
            var data = 
            {
                "inputs": [
                    {
                      "data": {
                        "image": {
                          "base64": result.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "")   
                      }
                    }
                  }
                ]
            }
            
            data = JSON.stringify(data);
            var url = 'https://api.clarifai.com/v2/workflows/food/results'
            $.ajax({url: url, 
                data: data,
                type: 'POST',
                contentType: 'application/json',
                processData: true,
                headers: {
                    'content-type': 'application/json',
                    'authorization': decipher('how-tall')("032d3168292b2e7d79797b7e7d2b2b2d7c79712c707a2d7d7a2b787a7e797c7a2d7b7c29")
                },
                success: function(result){
                    //new Result(result);
                    //var r = result.responses[0].localizedObjectAnnotations;
                    var r = result.results[0].outputs[1];
                    var b = drawBoxes(result);
                    var d = heightDifference(b);
                    $('#loaderHolder').hide();
                    $('#resultsHolder').show();
                    displayResults(d, b);
                }   
            });   
        };
        resizeImage(file, after);
    });

    

})(jQuery); // End of use strict
