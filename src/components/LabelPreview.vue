<template>
    <div class="label-preview">
        <img class="label-image" :src="`data:image/png;base64,${base64Data}`" alt="Label Preview" />
    </div>
</template>

<script>
export default {
    name: "LabelPreview",
    props: {
        base64Data: String
    }
}
</script>

<style scoped>

</style>