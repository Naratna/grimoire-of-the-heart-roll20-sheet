<script lang="ts">
	import ChippedDiv from '$lib/ChippedDiv.svelte';
	import Label from '$lib/Label.svelte';
</script>

<div class="portrait">
	<Label i18n="portrait">Portrait</Label>
	<ChippedDiv>
		<img alt="avatar" name="attr_character_avatar" />
	</ChippedDiv>
</div>

<style lang="sass">
    img
        height: 100%
        width: 100%
        object-fit: cover

    .portrait
        height: 100%
        padding: 8px
        display: grid
        grid-template-rows: auto 1fr

    .portrait > :global(.chipped-div)
        --chip-size: 30px
</style>
