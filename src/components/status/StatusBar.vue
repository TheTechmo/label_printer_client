<template>
    <b-container fluid>
        <b-row id="StatusBar">
            <status-bar-segment :status="lp_status">
                Label Printer Connection
            </status-bar-segment>
            <status-bar-segment :status="rs_status">
                Relay Server Connection
            </status-bar-segment>
            <status-bar-segment :status="ls_status">
                Label Service Connection
            </status-bar-segment>
        </b-row>
    </b-container>
</template>

<script>
import StatusBarSegment from "./StatusBarSegment";
export default {
    name: "StatusBar",
    components: {
        StatusBarSegment
    },
    props: {
        lp_status: Boolean,
        rs_status: Boolean,
        ls_status: Boolean,
    }
}
</script>

<style scoped lang="scss">
#StatusBar {
  //height: 4rem;
}
</style>