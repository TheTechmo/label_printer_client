<template>
    <div>
        <div v-b-modal.admin-modal id="admin-button"></div>
        <b-modal id="admin-modal" title="Admin Area" hide-footer>
            <b-form @submit.prevent="submit">
                <b-form-input @update="resetState" v-model="input" :state="inputState" class="p-3"
                              placeholder="admin password" type="password"></b-form-input>
            </b-form>
        </b-modal>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'

const PASSWORD = "AnamatronicS";

interface IData {
    input: string,
    inputState: boolean | null
}

export default Vue.extend({
    name: "AdminThings",
    data(): IData {
        return {
            input: "",
            inputState: null,
        }
    },
    methods: {
        submit() {
            this.inputState = this.input === PASSWORD
        },
        resetState() {
            this.inputState = null
        }
    }
})
</script>

<style scoped lang="scss">

#admin-button {
  position: fixed;
  height: 50px;
  width: 50px;
  bottom: 0;
  right: 0;
  z-index: 101;
  cursor: default;
}
</style>