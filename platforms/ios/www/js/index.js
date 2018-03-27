//Core APP Engine
/*jshint esversion: 6 */

var APP = (function () {
    let reviews = [];
    let picTaken = false; //Flag to see if the user has taken a Picture
    let stars = document.querySelectorAll('.star'); //Selector for clickable stars
    let review = {};

    //Function that generates the List view Page
    function genList() {
        let list = document.getElementById('js-list');
        //Checking if the user has no reviews and then display a message if true
        if (localStorage.length == 0) {
            list.innerHTML = "";
            setTimeout(() => {
                overFunc('empty');
            }, 400); //Some timeout to display message after you delete last element on local storage
        } else {
            list.innerHTML = "";
            reviews = []; //Lazy coding clearing everything everytime...
            for (let i = 0, key, len = localStorage.length; i < len; i++) {
                key = localStorage.key(i);
                reviews.push(JSON.parse(localStorage[key]));
            }
            list.appendChild(listBuilder(reviews));
        }
    }

    //Function that builds the List elements and return then to the generator
    function listBuilder(arr) {
        let ul = document.createElement('ul');
        ul.classList.add('list-view');
        arr.forEach((rev) => {
            //Creates the List ITEM element
            let li = document.createElement('li');
            li.classList.add('list-item');
            li.setAttribute('id', rev.id);
            //Creating the User Mini avatar
            let img = document.createElement('img');
            img.src = rev.img;
            img.alt = `A review picture`;
            img.classList.add('avatar');
            li.appendChild(img);
            //Create the paragraph and action button
            let p = document.createElement('p');
            p.textContent = `${rev.description}`;
            li.appendChild(p);
            let rating = rev.rating;
            let ratingdiv = document.createElement('div');
            while (rating > 0) {
                let starspan = document.createElement('span');
                starspan.classList.add('star');
                starspan.classList.add('rated');
                ratingdiv.appendChild(starspan);
                rating--;
            }
            li.appendChild(ratingdiv);
            let span = document.createElement('span');
            span.classList.add('action-right');
            span.classList.add('icon');
            span.classList.add('arrow_right');
            span.id = 'js-more';
            span.addEventListener('click', nav);
            li.appendChild(span);
            ul.appendChild(li);
        });
        return ul;
    }

    function takePicture() {
        let opts = {
            quality: 80,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            mediaType: Camera.MediaType.PICTURE,
            encodingType: Camera.EncodingType.JPEG,
            cameraDirection: Camera.Direction.BACK,
            allowEdit: true,
            targetWidth: 300,
            targetHeight: 300
        };
        navigator.camera.getPicture((imgURI) => {
            document.getElementById('js-img').src = imgURI;
            picTaken = true;
        }, fail, opts);
    }

    function fail(err) {
        console.log(err);
        overFunc('error');
    }

    //Save Review Function
    function saveReview() {
        review.id = Date.now();
        review.img = document.getElementById('js-img').getAttribute('src');
        review.description = document.getElementById('js-desc').value;
        review.rating = document.querySelector('.stars').getAttribute('data-rating');
        localStorage.setItem(review.id, JSON.stringify(review));
         //Save IMG to permament folder
        window.resolveLocalFileSystemURL(review.img, moveToPerm, fail);
    }

    function moveToPerm(entry) {
        let imgName = review.id + ".jpg";
        let appFolder = "ReviewR";
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
                //The folder is created if doesn't exist
                fileSys.root.getDirectory(appFolder, {
                        create: true,
                        exclusive: false
                    },
                    function (dir) {
                        entry.copyTo(dir, imgName, (final) => {
                            review.img = final.nativeURL;
                            window.cordova.plugins.imagesaver.saveImageToGallery(final.nativeURL,()=>{
                                console.log("Image saved to Gallery");
                            }, fail);
                            localStorage.setItem(review.id, JSON.stringify(review));
                        }, fail);
                    }, fail);
            },
            fail);
    }

    //Function to Generate the Details View
    function genDetail(lsID) {
        let detail = document.getElementById('js-detail');
        detail.innerHTML = "";
        let review = JSON.parse(localStorage[lsID]);
        let card = document.createElement('div');
        card.setAttribute('id', review.id);
        card.classList.add('card');
        card.classList.add('fixed');
        let img = document.createElement('img');
        img.src = review.img;
        img.alt = "A Review Picture";
        card.appendChild(img);
        let rating = review.rating;
        let ratingdiv = document.createElement('div');
        while (rating > 0) {
            let starspan = document.createElement('span');
            starspan.classList.add('star');
            starspan.classList.add('rated');
            ratingdiv.appendChild(starspan);
            rating--;
        }
        card.appendChild(ratingdiv);
        let p = document.createElement('p');
        p.textContent = review.description;
        card.appendChild(p);
        detail.appendChild(card);
    }

    //Overlay function to display message BASED ON THE SCOPE PASSED
    function overFunc(scope) {
        let overlay = document.querySelector('.overlay-bars');
        switch (scope) {
            case 'save':
                document.querySelector('.info').innerHTML = "Saved Review";
                break;
            case 'delete':
                document.querySelector('.info').innerHTML = "Deleted Review";
                break;
            case 'empty':
                document.querySelector('.info').innerHTML = "You have no reviews. Add one at the top.";
                break;
            case 'takePicture':
                document.querySelector('.info').innerHTML = "Please add a picture to your review.";
                break;
            case 'error':
                document.querySelector('.info').innerHTML = "A error has happened while trying to save your picture";
        }
        overlay.classList.add('active');
        //If statment for a longer call;
        if (scope == 'empty') {
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 1000); //Timeout for animation
        } else {
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 300); //Timeout for animation
        }
    }

    //FUNCTION THAT DOES EVERY NAVIGATION ON PAGE all based on context being passed
    function nav(ev) {
        let listPage = document.getElementById('js-list-page');
        let addPage = document.getElementById('js-add-page');
        let detailPage = document.getElementById('js-detail-page');
        switch (ev.target.id) {
            //When user selects add new Review
            case 'js-add':
                clearFields();
                stars[0].dispatchEvent(new MouseEvent('click'));
                addPage.classList.add('active');
                listPage.classList.remove('active');
                break;
                //When user selects a review retail
            case 'js-more':
                genDetail(ev.target.parentElement.getAttribute('id'));
                detailPage.classList.add('active');
                listPage.classList.remove('active');
                break;
                //When use saves, will not save until picture has been taken
            case 'js-save':
                if (picTaken) {
                    saveReview();
                    genList();
                    overFunc('save');
                    listPage.classList.add('active');
                    addPage.classList.remove('active');
                } else {
                    overFunc('takePicture');
                }
                break;
                //When user deletes a review in the details page
            case 'js-delete':
                localStorage.removeItem(document.querySelector('.card').getAttribute('id'));
                overFunc('delete');
                genList();
                //All roads lead to here (back to default page)
            default:
                listPage.classList.add('active');
                addPage.classList.remove('active');
                detailPage.classList.remove('active');
        }
    }

    //Basic function to clear input fields
    function clearFields() {
        document.getElementById('js-desc').value = "";
        document.querySelector('.stars').setAttribute('data-rating', 1);
        document.getElementById('js-img').src = "";
        picTaken = false;
    }

    //Function to handle the star rating system
    function setRating(ev) {
        let span = ev.currentTarget;
        let match = false;
        let num = 0;
        stars.forEach(function (star, index) {
            if (match) {
                star.classList.remove('rated');
            } else {
                star.classList.add('rated');
            }
            if (star === span) {
                match = true;
                num = index + 1;
            }
        });
        document.querySelector('.stars').setAttribute('data-rating', num);
    }

    //Initialization function, Adding all necessary handlers
    function init() {
        document.getElementById('js-add').addEventListener('click', nav);
        document.getElementById('js-save').addEventListener('click', nav);
        document.getElementById('js-cancel').addEventListener('click', nav);
        document.getElementById('js-back').addEventListener('click', nav);
        document.getElementById('js-delete').addEventListener('click', nav);
        document.getElementById('js-picture').addEventListener('click', takePicture);
        stars.forEach(function (star) {
            star.addEventListener('click', setRating);
        });
        genList();
    }

    document.addEventListener('deviceready', init);

})();