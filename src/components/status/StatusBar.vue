<template>
    <b-container fluid>
        <b-row id="StatusBar">
            <!-- Label printer status -->
            <status-bar-segment :status="lp_status">
                Label Printer Connection
            </status-bar-segment>

            <!-- Relay server status -->
            <status-bar-segment :status="rs_status">
                Relay Server Connection
            </status-bar-segment>

            <!-- DLS status -->
            <status-bar-segment :status="ls_status">
                Label Service Connection
            </status-bar-segment>
        </b-row>
    </b-container>
</template>

<script lang="ts">
import StatusBarSegment from "./StatusBarSegment.vue";

import Vue from 'vue'

// Pretty self explanatory
export default Vue.extend({
    name: "StatusBar",
    components: {
        StatusBarSegment
    },
    props: {
        // Label printer status
        lp_status: Boolean,

        // Relay server status
        rs_status: Boolean,

        // DLS status
        ls_status: Boolean,
    }
})
</script>

<style scoped lang="scss">
#StatusBar {
  //height: 4rem;
}
</style>
