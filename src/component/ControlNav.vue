<template lang="pug">
div.book-control
    div.ctrl-nav
        div.nav-body.active
            div.zoom-icon.zoom-icon-in(data-toggle="tooltip" data-placement="left" data-navTip="0")
                i.fa.fa-expand(aria-hidden="true")
            div.thumb-toggle(data-toggle="tooltip" data-placement="left" data-navTip="1")
                i.fa.fa-th-large(aria-hidden="true")
            div.mode-toggle(data-toggle="tooltip" data-placement="left" data-navTip="3")
                i.fa.fa-toggle-on(aria-hidden="true")
                i.fa.fa-toggle-off(aria-hidden="true")
            div.nav-icon.active
                i.fa.fa-caret-up(aria-hidden="true")
                i.fa.fa-caret-down(aria-hidden="true")
</template>

<script>
export default {
    data() {
        return {
        };
    },
    props: [
        'handleEvents'
    ],
    methods: {
        openPrint() {
            this.handleEvents.openPrint();
        }
    }
};
</script>
