import './style.scss';
import 'bulma';
import _ from 'lodash';


import { createList } from './module';

import { fishes } from './data/fish//allfish.js';



function trackDataIdClicks(dataIdValue) {
    ga('send', 'event', 'Clic', 'DataId', dataIdValue);
}


function updateQueryParam(key, value) {
    var url = new URL(window.location.href);
    url.searchParams.set(key, value);

    var newUrl = url.href;
    window.history.replaceState({ path: newUrl }, '', newUrl);
}


function getCookieValue(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }
    return '';
  }
  
  
let lang = getCookieValue("language") ? getCookieValue("language") : "en";


function findMatchingId(originalId, tolerance) {
    const originalFish = _.find(fishes, { id: originalId });

    if (!originalFish) {
        return []; // Aucune correspondance trouvée
    }

    const originalPositions = originalFish.positions;

    const matchingFish = _.filter(fishes, (f) => {
        if (f.id === originalId) {
            return false; // Ignorer l'ID d'origine
        }

        const isMatchingPosition = _.some(f.positions, (pos) => {
            return _.some(originalPositions, (originalPos, index) => {
                const isMatching = (
                    pos.x > (originalPos.x - tolerance) &&
                    pos.x < (originalPos.x + tolerance) &&
                    pos.y > (originalPos.y - tolerance) &&
                    pos.y < (originalPos.y + tolerance)
                );

                if (isMatching) {
                    f.originalPosition = index; // Ajouter originalPosition à l'objet correspondant
                }

                return isMatching;
            });
        });

        return isMatchingPosition && f.map === originalFish.map;
    });

    return _.map(matchingFish, (fish) => {
        const matchingPositions = _.filter(fish.positions, (pos) => {
            return (
                pos.x > (originalPositions[0].x - tolerance) &&
                pos.x < (originalPositions[0].x + tolerance) &&
                pos.y > (originalPositions[0].y - tolerance) &&
                pos.y < (originalPositions[0].y + tolerance)
            );
        });

        const neighborPositions = _.map(matchingPositions, (pos) => {
            return {
                x: pos.x,
                y: pos.y
            };
        });

        return {
            id: fish.id,
            neighborPositions: neighborPositions,
            name: fish.name,
            originalPosition: fish.originalPosition // Ajouter originalPosition au résultat
        };
    });
}



document.addEventListener('DOMContentLoaded', () => {

    let currentId = "01";
    let currentFish = _.find(fishes, { id: currentId });
    let currentMinPoints = (currentFish.type == "common" ? 300 : currentFish.type == "rare" ? 400 : currentFish.type == "epic" ? 500 : 5000)
    let unit = "kgs";
    document.querySelector(".weight-toggle-container input").addEventListener("change", (e) => {
        unit = e.target.checked ? "kgs" : "lbs";
        Array.from(document.querySelectorAll("[data-unit")).forEach(element => {
            element.setAttribute("data-unit", unit);
        })
        loadFish(currentId, lang);
    })

    // Functions to open and close a modal
    function openModal($el) {
        $el.classList.add('is-active');
    }

    function closeModal($el) {
        $el.classList.remove('is-active');
    }

    function closeAllModals() {
        (document.querySelectorAll('.modal') || []).forEach(($modal) => {
            closeModal($modal);
        });
    }

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);
        $trigger.addEventListener('click', () => {
            openModal($target);
        });
    });

    // Add a click event on various child elements to close the parent modal
    (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
        const $target = $close.closest('.modal');

        $close.addEventListener('click', () => {
            closeModal($target);
        });
    });

    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
        const e = event || window.event;

        if (e.keyCode === 27) { // Escape key
            closeAllModals();
        }
    });


    function toggleSideMenu() {
        document.querySelector(".csidebar").classList.toggle("visible");
        document.querySelector(".menu-toggle").classList.toggle("toggle-is-visible");
    }
    document.querySelector(".menu-toggle").addEventListener("click", () => {
        toggleSideMenu();
    })

    /**SWIPE */
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);

    var xDown = null;
    var yDown = null;

    function handleTouchStart(evt) {
        const firstTouch = evt.touches[0];
        xDown = firstTouch.clientX;
        yDown = firstTouch.clientY;
    };

    function handleTouchMove(evt) {
        if (!xDown || !yDown) {
            return;
        }

        var xUp = evt.touches[0].clientX;
        var yUp = evt.touches[0].clientY;

        var xDiff = xDown - xUp;
        var yDiff = yDown - yUp;

        if (Math.abs(xDiff) > Math.abs(yDiff)) {
            if (xDiff > 0) {
                // Swipe to the left
                if (!isTargetElementRange(evt.target)) {
                    triggerSwipeLeftEvent();
                }
            } else {
                // Swipe to the right
                if (!isTargetElementRange(evt.target)) {
                    triggerSwipeRightEvent();
                }
            }
        }

        // Reset values
        xDown = null;
        yDown = null;
    };

    function isTargetElementRange(targetElement) {
        return targetElement.id === 'range';
    }

    function triggerSwipeLeftEvent() {
        document.querySelector(".csidebar").classList.remove("visible")
    }

    function triggerSwipeRightEvent() {
        document.querySelector(".csidebar").classList.add("visible")
    }


    function setLang(lang) {

    }

    fishes.forEach(fish => {    
        createList(fish, lang);
    })

    function bindEventListenerToItem() {
        Array.from(document.querySelectorAll(".item")).forEach(item => {
            item.addEventListener("click", () => {
                currentId = item.getAttribute("data-id")
                loadFish(currentId, lang)
            })
        })
    }

    bindEventListenerToItem()

    Array.from(document.querySelectorAll("[data-lang")).forEach(langBtn => {
        let prefLang = getCookieValue("language") || "en"
        if(langBtn.getAttribute("data-lang") == prefLang) {
            langBtn.classList.add("selected-language")
        }
        getCookieValue("language")
        langBtn.addEventListener("click", () => {
            const lang = langBtn.getAttribute("data-lang")
            Array.from(document.querySelectorAll("[data-lang")).forEach(elem => elem.classList.remove("selected-language"));
            langBtn.classList.add("selected-language")
            loadFish(currentId, lang)
            document.querySelector("#fish-list").innerHTML = "";
            fishes.forEach(fish => {        
                createList(fish, lang)
            });
            document.cookie = "language=" + lang + "; expires=Fri, 31 Dec 9999 23:59:59 GMT";   
            bindEventListenerToItem();        
        })
    })

    function loadFish(id, lang) {

        // TODO NEIGHBOR
        console.log(findMatchingId(id, 10));



        const fish = _.find(fishes, { id: id });
        currentFish = fish;

        currentMinPoints = (currentFish.type == "common" ? 300 : currentFish.type == "rare" ? 400 : currentFish.type == "epic" ? 500 : 5000)

        updateRange();
        Array.from(document.querySelectorAll(".unit")).forEach(elem => {
            elem.innerHTML = unit;
        })
        document.getElementById("range").value = 50;

        document.querySelector(".cdata-container").setAttribute("data-map", fish.map);

        const isIn = fish.seasons[new Date().getMonth()] ? "in" : "out";

        document.querySelector("#season-message").setAttribute("class", isIn);


        document.querySelector(".season-max-weight .mm-value").innerHTML = (currentFish[unit].min + ((currentFish[unit].max - currentFish[unit].min) * 0.2)).toFixed(2);

        document.querySelector(".season-max-points .mm-value").innerHTML = currentMinPoints + currentMinPoints * 0.2;


        document.querySelector("#no-shadow").setAttribute("data-noshadow", typeof currentFish.attributes[0].shadow[0] == "undefined" ? true : false);

        currentFish.attributes.forEach(attribute => {
            const attributeName = Object.keys(attribute)[0];
            const elem = document.querySelector(`[data-fishattribute='${attributeName}']`) || false;
            if (elem) {
                Array.from(elem.querySelectorAll(".svg-container")).forEach((svg, index) => {
                    svg.setAttribute("data-current-svg", attribute[attributeName].includes(index) || false)
                })
            }
        })

        
        document.getElementById("fishName").innerHTML = fish.name[lang] ? fish.name[lang] : fish.name.en;
        document.getElementById("fishType").innerHTML = fish.type;
        document.getElementById("map").setAttribute("src", `./images/map-${fish.map}.jpg`);
        document.getElementById("mapName").innerHTML = fish.map;
        document.getElementById("mapName").setAttribute("class", `map-${fish.map}`)
        document.getElementById("positionNote").innerHTML = fish.positionNote
        document.getElementById("positions-container").innerHTML = "";
        for (let i = 0; i < fish.positions.length; i++) {
            const position = document.createElement("div");
            position.setAttribute("class", "ccross");
            position.setAttribute("data-fishid", id)
            position.setAttribute("style", `background-image:url("./images/${id}.png");top:${fish.positions[i].x}%;left:${fish.positions[i].y}%`)
            document.getElementById("positions-container").appendChild(position)
        }

        fish.seasons.forEach((month, index) => {
            month ? document.querySelectorAll(".months-container > div")[index].setAttribute("class", "season") : document.querySelectorAll(".months-container > div")[index].removeAttribute("class");
        });

        document.querySelector("#minmax-min-points").innerHTML = currentMinPoints;
        document.querySelector("#minmax-max-points").innerHTML = currentMinPoints * 2;

        document.querySelector(".cdata-container").setAttribute("data-season", currentFish.seasons[new Date().getMonth()])

        document.getElementById("fish-image").setAttribute("src", `./images/${fish.id}.png`);

        Array.from(document.querySelectorAll("#minweight, #minmax-min-weight")).forEach(element => {
            element.innerHTML = fish[unit].min;
        });

        Array.from(document.querySelectorAll("#maxweight, #minmax-max-weight")).forEach(element => {
            element.innerHTML = fish[unit].max;
        })


        Array.from(document.querySelectorAll(".step-weight")).forEach((step, index) => {
            const fifth = (fish[unit].max - fish[unit].min) * 0.2;
            step.innerHTML = (fish[unit].min + fifth * (index * 1)).toFixed(2);
        })

        Array.from(document.querySelectorAll(".step-points")).forEach((step, index) => {
            const fifth = currentMinPoints / 5;
            step.innerHTML = currentMinPoints + (fifth * (index));
        })


        if (currentFish.type == "monster") {

            function setTodaySpot(date, collection, referenceDate) {

                for (let i = 0; i < collection.length; i++) {
 


                    let dateN = new Date(date);
                    dateN.setDate(dateN.getDate() + (i - 1));
                    const dateText = (dateN.getMonth() + 1).toString().padStart(2, "0") + "/" + dateN.getDate().toString().padStart(2, "0")

                    const timeDiff = Math.floor((dateN - referenceDate) / (1000 * 60 * 60 * 24));
                    const index = timeDiff >= 0 ? timeDiff % collection.length : (collection.length + timeDiff) % collection.length;

                    collection[index].setAttribute('data-today-spot', 'false');
                    collection[index].removeAttribute('data-spot-day'); 

                    if (dateN.getDate() == new Date(date).getDate()) {
                        collection[index].setAttribute('data-today-spot', 'true');

                    }
                    collection[index].setAttribute('data-spot-day', dateText);

                }
            }


            const currentDate = new Date().setDate(new Date().getDate() + 0);
            const htmlCollection = document.getElementsByClassName('ccross');
            const referenceDate = new Date(2023, 5, 1);

            setTodaySpot(currentDate, htmlCollection, referenceDate);
        }

        document.querySelector(".active")?.classList.remove("active");
        document.querySelector(`[data-id="${id}"]`).classList.add("active");


        if (currentFish.difficulty !== 'undefined') {
            Array.from(document.querySelectorAll(".difficulty")).forEach((elem, index) => {
                if (currentFish.difficulty == index) {
                    elem.style.display = "block";
                }
                else {
                    elem.style.display = "none";
                }
            })
        }

        document.querySelector("html").setAttribute("class", currentFish.type)


    }



    loadFish(currentId, lang)


    document.querySelectorAll(".months-container > div")[new Date().getMonth()].setAttribute("data-current", "true");


    function updateRange(percent = 10) {
        document.getElementById("range-values-container").style.left = percent + "%";
        document.getElementById("percent").innerHTML = Number(percent).toFixed(2);

        Array.from(document.querySelectorAll(".stars-container .svg-container")).forEach((container, index) => {
            container.setAttribute("data-current-svg", percent > (index) * 20)
        })


        document.querySelector("#weight").value = ((currentFish[unit].max - currentFish[unit].min) * (Number(percent) / 100) + currentFish[unit].min).toFixed(3);


        document.querySelector("#points").value = (currentMinPoints + currentMinPoints * (percent / 100)).toFixed();
        document.querySelector("#range-color").style.width = percent + "%"
        document.getElementById("range").value = percent;
    }

    document.querySelector("#range").addEventListener("input", (e) => {
        updateRange(e.target.value)
    })


    Array.from(document.querySelectorAll(".range-input")).forEach(input => {
        input.addEventListener("keyup", () => {

            if (input.getAttribute("id") == "points") {
                if (input.value >= currentMinPoints && input.value <= (currentMinPoints * 2)) {
                    const currentPercent = ((input.value - currentMinPoints) / currentMinPoints) * 100;
                    updateRange(currentPercent)
                }
            }

            if (input.getAttribute("id") == "weight") {
                if (input.value >= currentFish[unit].min && input.value <= currentFish[unit].max) {
                    if (/^\d+(\.\d{3})$/.test(input.value)) {
                        const currentPercent = ((input.value - currentFish[unit].min) / (currentFish[unit].max - currentFish[unit].min)) * 100;

                        updateRange(currentPercent)
                    }
                }
            }
        })
    })


    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("list-title")) {
            e.target.closest(".list-container").classList.toggle("hidden-list");
        }
        if (e.target.classList.contains("fishp")) {
            const clickedId = e.target.closest(".item").getAttribute("data-id");
            trackDataIdClicks(clickedId)
        }
    })


    const items = Array.from(document.querySelectorAll(".item"));


    function checkScreenWidth() {
        var screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var isLessThan768 = screenWidth < 768;
        if (isLessThan768) {
            document.querySelector(".csidebar").classList.remove("visible");

            items.forEach(item => {
                item.addEventListener("click", () => {
                    document.querySelector(".csidebar").classList.remove("visible");
                })
            })
        }
    }

    window.addEventListener('load', function () {
        checkScreenWidth();
    });

    window.addEventListener('resize', function () {
        checkScreenWidth();
    });



    var scrollableElement = document.querySelector('.section.cscrollable');

    scrollableElement.addEventListener('scroll', function (event) {
        var scrollTop = event.target.scrollTop;

        if (scrollTop > 50) {
            document.querySelector("#header .is-flex:first-of-type").classList.add("sticky")
            var eventScrollMoreThan50 = new CustomEvent('scrollMoreThan50Event');
            document.dispatchEvent(eventScrollMoreThan50);
        } else if (scrollTop >= 0 && scrollTop <= 50) {
            document.querySelector("#header .is-flex:first-of-type").classList.remove("sticky")
            var eventScrollBetween0And50 = new CustomEvent('scrollBetween0And50Event');
            document.dispatchEvent(eventScrollBetween0And50);
        }
    });

});


function onPageLoad(callback) {
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
}
onPageLoad(function () {
    setTimeout(() => {
        document.body.classList.remove("is-loading");

    }, 500)
});


