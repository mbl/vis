all: main.vert.spv main.frag.spv

main.vert.spv: main.vert Makefile
	glslangValidator -V -S vert -o $@ $<

main.frag.spv: main.frag Makefile
	glslangValidator -V -S frag -o $@ $<