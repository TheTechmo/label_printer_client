<template>
    <!--
        THIS IS A WORK IN PROGRESS! The DLS rendered images look terrible so I plan on rendering my own.
    -->
    <div class="fancy-label">
        <b-row class="label-header" no-gutters>
            <b-col cols="2" class="justify-content-center">
                <div class="item-size-circle"></div>
                <div class="item-size">L</div>
            </b-col>
            <b-col>
                <span class="item-name">Iced Latte</span>
            </b-col>
        </b-row>
        <div class="item-details">
            Something something else something something else sdasfef sdfsdfer asdaeaw dsfgrge a asdewrg rsfasda
        </div>
        <div class="label-tagline">
            Whai Mana
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
    name: "FancyLabel"
})
</script>

<style scoped lang="scss">
.fancy-label {
    height: 150px;
    margin-bottom: 20px;
    aspect-ratio: 411.75 / 180;
    background: white;
    border-radius: 12px;
    box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.3);
    text-align: left;
    padding: 1rem;
}

.label-header {
    font-weight: bold;
    font-size: 1.9em;
    margin-bottom: 5px;
    //height: 2rem;
}

.item-name {
    padding-left: 0.5rem;
}

.item-size, .item-size-circle {
    position: absolute;
    height: 100%;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
}

.item-size {
    text-align: center;
    font-weight: 800;
    bottom: 1px;
}

.item-size-circle {
    aspect-ratio: 1 / 1;
    border: 1px solid black;
    z-index: 100;
    border-radius: 50%;
}

.item-details {
    font-size: 0.9rem;
    line-height: normal;
}

.label-tagline {
    margin-top: 5px;
    padding-top: 2px;
    border-top: 1px solid black;
    font-size: 0.7rem;
    text-align: right;
}
</style>
