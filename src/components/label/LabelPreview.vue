<template>
    <div class="label-preview">
        <img class="label-image" :src="`data:image/png;base64,${base64Data}`" alt="Label Preview" />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

// Just takes the base-64 data of a rendered label and displays it.
export default Vue.extend({
    name: "LabelPreview",
    props: {
        base64Data: String
    }
})
</script>

<style scoped>

</style>
