.PHONY: test
test:
	deno test --allow-read

.PHONY: decode
decode:
	deno run --allow-read main.ts nasa.gif

.PHONY: run
run:
	deno run --allow-read --allow-write replace_single_quote_in_header.ts nasa.gif
	deno run --allow-read --allow-write insert_comment_block.ts replace_single.gif
	mv inserted_comment.gif exceturable.gif
