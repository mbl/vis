all: math.wat

.PRECIOUS: %.wasm

%.wat: %.wasm
	wasm2wat -o $@ $<

%.wasm: %.c
	clang -g -O2 --target=wasm32 --no-standard-libraries -Wl,--export-all -Wl,--no-entry  -o $@ $<

clean:
	rm -f math.wat *.wasm
