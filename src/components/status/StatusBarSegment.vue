<template>
    <!-- Coloured parent -->
    <b-col :class="'status-segment bg-' + colour">

        <!-- Inner content -->
        <div class="status-segment-inner">
            <b-row align-v="center" no-gutters>
                <b-col/>

                <!-- Large centered column -->
                <b-col cols="8">
                    <b-row class="status-segment-row text-center" align-v="center" no-gutters>
                        <!-- Icon -->
                        <b-col class="text-center" cols="2">
                            <b-icon class="status-icon"
                                    :data-blink="!status"
                                    :icon="icon"
                                    font-scale="2"></b-icon>
                        </b-col>
                        <b-col>
                            <!-- Text -->
                            <slot/>
                        </b-col>
                    </b-row>
                </b-col>
                <b-col/>
            </b-row>

        </div>
    </b-col>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
    name: "StatusBarSegment",
    props: {
        status: Boolean,
    },
    computed: {
        // Get colour from status
        colour() {
            return this.status ? "success" : "danger"
        },

        // Get icon from status
        icon() {
            return this.status ? 'check-circle-fill' : 'exclamation-triangle-fill'
        },
    },
})
</script>

<style scoped lang="scss">
@import "../../assets/scss/vendors/bootstrap-vue/_custom";


// Outer segment
.status-segment {
  font-size: 18px;
  padding: 0.5em 0 !important;
  color: white;
  font-weight: bold;
  line-height: 1.5em;


  // Inner segment
  .status-segment-inner {
    margin: 5px 0 !important;
    padding: 5px 0;
    border-color: white;
    border-width: 1px;
    cursor: default !important;
  }

  .status-segment-row {
    @include margin-x(auto);
  }

  // Segment icon
  .status-icon[data-blink=true] {
    animation: blink 1s ease-out 0s infinite alternate forwards;
  }

  // Dividers
  &:nth-child(1) .status-segment-inner {
    border-right-style: solid;
  }

  &:nth-child(2) .status-segment-inner {
    border-left-style: solid;
    border-right-style: solid;
  }

  &:nth-child(3) .status-segment-inner {
    border-left-style: solid;
  }


  // Animations
  @keyframes blink {
    0% {
      opacity: 0.1;
    }

    10% {
      opacity: 0.2;
    }

    80% {
      opacity: 1;
    }

    100% {
      opacity: 1;
    }
  }


}

</style>
