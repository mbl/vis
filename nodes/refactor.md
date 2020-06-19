SOA approach

1) Draw
2) Interact
3) Interpret
4) Compile

Draw + Interact === one pass because IMGUI

for each connection
   draw bezier curve

for each node
   draw rectangle + title
   for each port
      draw port + label + value

Notes:
  - nodes are transparent (need to be drawn in order)
  - most nodes do not overlap other nodes <<< possible optimization
  - IMGUI can operate with single shader + single texture, many quads
  - stress on flexibility and simplicity < - goes against performance
  - eventually animate connections so do not reuse connection geometry

=================

Optimal structures: Draw

struct Connection[] {
    x1, y1, x2, y2 
}

struct Node[] {
    x, y, w, h
    title
    struct Port[] {
        union {
            input
            connectedTo
            ----
            output
            x, y
        }
        label
        value
    }
}

=================

Optimal structures: Interpret
   - note that that interpreter is just a throwaway code on the way to compiler
   - does not terribly matter

struct Node[] {                    <- sorted topologically by dependencies
    eval <- function to run
    InputPort[] {
        value / reference
    }
    OutputPort[] {
        value
    }
}

=================

Most context-ful way

struct Node {
    x, y, w, h, title << waste
    struct Ports[] {
        x, y
        type, label, value 
        numConnections // For output
        Port connectedTo // For input
    }
}