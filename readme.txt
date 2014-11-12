Makes it a walk in a park to create a ranged select slider. All you need is the code as in the example, and include the jQuery and JQuery UI slider. 

- Options for displaying labels on the handles, and displaying the handle values in html elements.
- Improvements on jquery's default ui slider:
    - Restricts the range to prevent minimum and maximum cross in combination with the select as steps.
    - Prevents "fast" users who move their mouse too quickly, to let the slider become corrupt
    - Makes it possible to use graceful degradation.
    - Automatic minimum and maximum range.

Example usage:
    <div class="slideranger"><!-- container div -->
        <select class="min"><!-- min select -->
            <option value="0">0 euro</option>
            <option value="10">10 euro</option>
            <option value="100">100 euro</option>
        </select>
        <select class="max"><!-- max select -->
            <option value="0">0 euro</option>
            <option value="10">10 euro</option>
            <option value="100">100 euro</option>
        </select>
        <div class="displayMin"></div>
        <div class="displayMax"></div>
    </div>

    <script>
        jQuery('.slideranger').slideRanger();
    </script>
