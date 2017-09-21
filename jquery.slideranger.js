//filter dynamic price slider
(function( options )
{
    jQuery.fn.slideRanger = function( options )
    {
        var slideRanger = this; //make it globally available

        slideRanger.slider = undefined; //going to contain a reference to jquery ui slider

        slideRanger.vars = //for set and get, and defaults.
        {
        };

        slideRanger.settings = jQuery.extend //set settings, and let options override 'em
        ({
            onUpdate      : false,
            onInit        : false,
            display       : false,
            hideSelects   : true,
            selectors :  //selectors or elements are both allowed. In case of a selector, the slideRanger will look in its main div.
            {
                min        : '.min',
                max        : '.max',
                slider     : '.slider',
                displayMin : '.displayMin',
                displayMax : '.displayMax'
            },
            preventSameValue: false
        }, options);

        slideRanger.methods =
        {
            /**
             * Initialize the slider. Always called when doing jQuery('.slideranger').slideRanger();
             * Calls other function to check and set everything that's needed.
             */
            init : function()
            {
                if(!slideRanger.initialized)
                {
                    this.autoSelectors();
                    this.setMinMax();
                    
                    this.set('prevMax', this.getMaxValue());    // config
                    this.set('prevMin', this.getMinValue());    // config
                    
                    this.initJquerySlider();
                    this.selectEvents();
                    this.hideSelects();
                    this.updateDisplay();
                    this.onInit();
                }
            },

            selectEvents: function ()
            {
                $(slideRanger.settings.selectors.min).change(function()
                {   
                    slideRanger.slider.slider("values", 0, $(this).find(":selected").index());
                });
                $(slideRanger.settings.selectors.max).change(function()
                {
                    slideRanger.slider.slider("values", 1, $(this).find(":selected").index());
                });
            },

            /**
             * Checks if the selectors of the settings, are in fact selectors, or objects.
             * If they are selectors they are hereby converted to objects.
             */
            autoSelectors : function ()
            {
                jQuery.each(slideRanger.settings.selectors, function(index, value)
                {
                    if(Object.prototype.toString.call(value) !== "[object Object]")
                    { //if it is not an object, make it one by using find.
                        slideRanger.settings.selectors[index] = slideRanger.find(value);
                    }
                });
            },

            /**
             * Determines and sets the minimum and maximum index of the range automatically.
             */
            setMinMax : function ()
            {
                slideRanger.methods.set('rangeMin', 0);
                var el = slideRanger.settings.selectors.max.find('option');
                slideRanger.methods.set('rangeMax', el.length - 1);
            },

            /**
             * Initialize the original jquery slider. Uses the determined min/max index and range.
             * Uses the events slide and stop to call our own functions there.
             */
            initJquerySlider : function ()
            {
                var i = 0;
                var curMax = slideRanger.settings.selectors.max.find('option:selected').index();
                
                //initialize the jquery ui slider.
                slideRanger.slider  = jQuery(slideRanger).slider
                ({
                    min: slideRanger.methods.get('rangeMin'),
                    max: slideRanger.methods.get('rangeMax'),
                    values: [slideRanger.methods.getMinIndex(slideRanger.methods.get('rangeMin')), curMax],
                    slide: function( event, ui )
                    {
                        slideRanger.methods.updateSliderSelectValues(ui);
                        slideRanger.addClass('busy');
                    },
                    stop: function( event, ui )
                    {
                        slideRanger.methods.updateSlideStop(ui);
                    },
                    range: true /*@todo: fix it in V2 / @see 11966 of jquery.ui.1.11.2 to prevent ui fuckups*/
                });
            },

            /**
             * Used when sliding. This uses the original ui values' min and max.
             * It calls updateMinMax with these values.
             *
             * @param ui
             */
            updateSliderSelectValues : function(ui)
            {
                values = ui.values;

                min = this.setNewMin(values[0], values[1]);
                max = this.setNewMax(values[0], values[1]);

                this.updateMinMax(min, max);
            },

            /**
             * Used when stopped sliding. Check if the slider has not been compromised
             * It calls updateMinMax with these values.
             *
             * @param ui
             */
            updateSlideStop : function(ui)
            {
                min = ui.values[0];
                max = ui.values[1];

                if(min > max) //minimum higher than max || maximum lower than min.
                {
                    min = Math.max(this.get('rangeMin'), max - 1);
                    max = Math.min(this.get('rangeMax'), min + 1);
                }

                if(slideRanger.settings.preventSameValue)
                {
                    //they cannot be the same.
                    if(min == this.get('rangeMax'))
                    {
                        min--;
                    }
                    else if(max == this.get('rangeMin'))
                    {
                        max++;
                    }
                }
                
                this.updateMinMax(min, max);
                
                this.set('prevMin', min);
                this.set('prevMax', max);
                
                slideRanger.settings.selectors.min.change().blur();
                slideRanger.settings.selectors.max.change().blur();
            },

            /**
             * Update min and max values and do everything that is related to updating
             * min and max values.
             *
             * @param min  minimum value
             * @param max  maximum value
             */
            updateMinMax : function(min, max)
            {
                this.set('curMax', max);    // config
                this.set('curMin', min);    // config
                this.setSlideValueMin(min); // prevent max to be higher than min
                this.setSlideValueMax(max); // prevent min to be higher than max
                this.setSelectValueMin(min);// update our select box min
                this.setSelectValueMax(max);// update our select box max
                this.updateDisplay();       // update html element display
                this.onUpdate();
            },

            /**
             * Update the price display. If enabled.
             */
            updateDisplay : function()
            {
                if(slideRanger.settings.display)
                {
                    slideRanger.settings.selectors.displayMin.html(this.getMinValue(true));
                    slideRanger.settings.selectors.displayMax.html(this.getMaxValue(true));
                }
            },

            /**
             * Get min index from minimum select.
             */
            getMinIndex : function(defaultIndex)
            {
                return this.getIndex(slideRanger.settings.selectors.min, defaultIndex);
            },

            /**
             * Get max index from maximum select.
             */
            getMaxIndex : function(defaultIndex)
            {
                return this.getIndex(slideRanger.settings.selectors.max, defaultIndex);
            },

            /**
             * Get selected index from a select box.
             */
            getIndex : function(selector, defaultIndex)
            {
                if(selector.find('option:selected').index())
                    return selector.find('option:selected').index();

                 //set the selectedIndex
                 this.setSelectValue(selector, defaultIndex);

                 return defaultIndex;
            },

            /**
             * Get selected minimum value from minimum select
             */
            getMinValue : function(asText)
            {
                return this.getSelectValue(slideRanger.settings.selectors.min, asText);
            },

            /**
             * Get selected maximum value from maximum select
             */
            getMaxValue : function(asText)
            {
                return this.getSelectValue(slideRanger.settings.selectors.max, asText);
            },

            /**
             * Get currently selected value from select box
             */
            getSelectValue : function(selectElem, text)
            {
                if(text)
                {
                    return selectElem.find('option:selected').text();
                }
                return selectElem[0].selectedIndex;
            },

            /**
             * Set the selectedindex on a select box by value.
             */
            setSelectValue : function(selectElem, value)
            {
                selectElem.prop('selectedIndex', value);
            },

            /**
             * Sets the current selected select option to a certain value, for the min select
             */
            setSelectValueMin : function(value)
            {
                this.setSelectValue(slideRanger.settings.selectors.min, value);
            },

            /**
             * Sets the current selected select option to a certain value, for the max select
             */
            setSelectValueMax : function(value)
            {
                this.setSelectValue(slideRanger.settings.selectors.max, value);
            },

            /**
             * Corrects the new minimum if needed. It is needed if the min is higher than max.
             */
            setNewMin : function (min, max)
            {
                var newmin;
                if(slideRanger.settings.preventSameValue)
                {
                    newmin = max - 1;
                }
                else
                {
                    newmin = max;
                }
                if (this.get('curMax') != max
                    && max <= min)
                    {
                    min = newmin;
                }
                return min;
            },

            /**
             * Corrects the new maximum if needed. It is needed if the maximum is lower than min.
             */
            setNewMax : function (min, max)
            {
                var newmax;
                if(slideRanger.settings.preventSameValue)
                {
                    newmax = min + 1;
                }
                else
                {
                    newmax = min;
                }
                if (this.get('curMin') != min
                    && min >= max)
                {
                    max = newmax;
                }
                return max;
            },

            /**
             * update the jquery ui slider with new values
             */
            setSlideValue: function(index, value)
            {
                curValues = slideRanger.slider.slider("values");
                curValues[index] = value;
                slideRanger.slider.slider("values", curValues);
            },

            /**
             * set the minimum value for jquery slider
             */
            setSlideValueMin : function(value)
            {
                this.setSlideValue(0, value);
            },

            /**
             * set the maximum value for jquery slider
             */
            setSlideValueMax : function(value)
            {
                this.setSlideValue(1, value);
            },

            /**
             * hide the select boxes, used by the slider.
             */
            hideSelects : function()
            {
                if(slideRanger.settings.hideSelects)
                {
                    //graceful degradation
                    slideRanger.settings.selectors.min.hide();
                    slideRanger.settings.selectors.max.hide();
                }
            },

            //get a var from the collection array
            get: function(varname)
            {
                if(typeof(slideRanger.vars[varname]) == "undefined")
                {
                    return false;
                }
                return slideRanger.vars[varname];
            },

            //set a var in the collection array
            set: function(varname, value)
            {
                slideRanger.vars[varname] = value;
            },

            // function callback. Calls the anonymously supplied function onUpdate
            onUpdate : function ()
            {
                if (typeof slideRanger.settings.onUpdate == 'function')
                {
                    slideRanger.settings.onUpdate(slideRanger);
                }
            },

            // function callback. Calls the anonymously supplied function onUpdate
            onInit : function ()
            {
                if (typeof slideRanger.settings.onUpdate == 'function')
                {
                    slideRanger.settings.onInit(slideRanger);
                }
            }
        };

        this.methods.init(); //initialize it all!
    }
})(jQuery);
