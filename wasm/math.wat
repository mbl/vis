(module
  (type (;0;) (func))
  (type (;1;) (func (param i32) (result i32)))
  (type (;2;) (func (param i32 i32 i32 f32 f32 f32 f32 f32 f32 i32 i32 i32)))
  (func $__wasm_call_ctors (type 0))
  (func $colorToUint32 (type 1) (param i32) (result i32)
    (local f32 i32 i32)
    block  ;; label = @1
      block  ;; label = @2
        local.get 0
        f32.load offset=4
        f32.const 0x1.fep+7 (;=255;)
        f32.mul
        local.tee 1
        f32.const 0x1p+32 (;=4.29497e+09;)
        f32.lt
        local.get 1
        f32.const 0x0p+0 (;=0;)
        f32.ge
        i32.and
        i32.eqz
        br_if 0 (;@2;)
        local.get 1
        i32.trunc_f32_u
        local.set 2
        br 1 (;@1;)
      end
      i32.const 0
      local.set 2
    end
    local.get 2
    i32.const 8
    i32.shl
    local.set 2
    block  ;; label = @1
      block  ;; label = @2
        local.get 0
        f32.load
        f32.const 0x1.fep+7 (;=255;)
        f32.mul
        local.tee 1
        f32.const 0x1p+32 (;=4.29497e+09;)
        f32.lt
        local.get 1
        f32.const 0x0p+0 (;=0;)
        f32.ge
        i32.and
        i32.eqz
        br_if 0 (;@2;)
        local.get 1
        i32.trunc_f32_u
        local.set 3
        br 1 (;@1;)
      end
      i32.const 0
      local.set 3
    end
    local.get 2
    local.get 3
    i32.or
    local.set 2
    block  ;; label = @1
      block  ;; label = @2
        local.get 0
        f32.load offset=8
        f32.const 0x1.fep+7 (;=255;)
        f32.mul
        local.tee 1
        f32.const 0x1p+32 (;=4.29497e+09;)
        f32.lt
        local.get 1
        f32.const 0x0p+0 (;=0;)
        f32.ge
        i32.and
        i32.eqz
        br_if 0 (;@2;)
        local.get 1
        i32.trunc_f32_u
        local.set 3
        br 1 (;@1;)
      end
      i32.const 0
      local.set 3
    end
    local.get 2
    local.get 3
    i32.const 16
    i32.shl
    i32.or
    local.set 2
    block  ;; label = @1
      block  ;; label = @2
        local.get 0
        f32.load offset=12
        f32.const 0x1.fep+7 (;=255;)
        f32.mul
        local.tee 1
        f32.const 0x1p+32 (;=4.29497e+09;)
        f32.lt
        local.get 1
        f32.const 0x0p+0 (;=0;)
        f32.ge
        i32.and
        i32.eqz
        br_if 0 (;@2;)
        local.get 1
        i32.trunc_f32_u
        local.set 0
        br 1 (;@1;)
      end
      i32.const 0
      local.set 0
    end
    local.get 2
    local.get 0
    i32.const 24
    i32.shl
    i32.or)
  (func $frame (type 2) (param i32 i32 i32 f32 f32 f32 f32 f32 f32 i32 i32 i32)
    (local i32 i32 i32 f32 i32 i32 f32 f32 f32 f32 f32 f32 f32)
    block  ;; label = @1
      local.get 9
      local.get 10
      i32.mul
      i32.const 2
      i32.shl
      local.tee 12
      i32.const 1
      i32.lt_s
      br_if 0 (;@1;)
      i32.const 0
      local.set 13
      loop  ;; label = @2
        local.get 11
        local.get 13
        i32.add
        local.tee 14
        i32.const 3
        i32.add
        i32.const 255
        i32.store8
        block  ;; label = @3
          block  ;; label = @4
            local.get 14
            i32.load8_u
            f32.convert_i32_u
            f32.const 0x1.99999ap-1 (;=0.8;)
            f32.mul
            local.tee 15
            f32.const 0x1p+32 (;=4.29497e+09;)
            f32.lt
            local.get 15
            f32.const 0x0p+0 (;=0;)
            f32.ge
            i32.and
            i32.eqz
            br_if 0 (;@4;)
            local.get 15
            i32.trunc_f32_u
            local.set 16
            br 1 (;@3;)
          end
          i32.const 0
          local.set 16
        end
        local.get 14
        local.get 16
        i32.store8
        block  ;; label = @3
          block  ;; label = @4
            local.get 14
            i32.const 1
            i32.add
            local.tee 16
            i32.load8_u
            f32.convert_i32_u
            f32.const 0x1.99999ap-1 (;=0.8;)
            f32.mul
            local.tee 15
            f32.const 0x1p+32 (;=4.29497e+09;)
            f32.lt
            local.get 15
            f32.const 0x0p+0 (;=0;)
            f32.ge
            i32.and
            i32.eqz
            br_if 0 (;@4;)
            local.get 15
            i32.trunc_f32_u
            local.set 17
            br 1 (;@3;)
          end
          i32.const 0
          local.set 17
        end
        local.get 16
        local.get 17
        i32.store8
        block  ;; label = @3
          block  ;; label = @4
            local.get 14
            i32.const 2
            i32.add
            local.tee 14
            i32.load8_u
            f32.convert_i32_u
            f32.const 0x1.99999ap-1 (;=0.8;)
            f32.mul
            local.tee 15
            f32.const 0x1p+32 (;=4.29497e+09;)
            f32.lt
            local.get 15
            f32.const 0x0p+0 (;=0;)
            f32.ge
            i32.and
            i32.eqz
            br_if 0 (;@4;)
            local.get 15
            i32.trunc_f32_u
            local.set 16
            br 1 (;@3;)
          end
          i32.const 0
          local.set 16
        end
        local.get 14
        local.get 16
        i32.store8
        local.get 13
        i32.const 4
        i32.add
        local.tee 13
        local.get 12
        i32.lt_s
        br_if 0 (;@2;)
      end
    end
    block  ;; label = @1
      local.get 1
      i32.const 1
      i32.lt_s
      br_if 0 (;@1;)
      local.get 2
      i32.const 28
      i32.add
      local.set 14
      local.get 10
      i32.const 2
      i32.div_s
      f32.convert_i32_s
      local.set 18
      local.get 9
      i32.const 2
      i32.div_s
      f32.convert_i32_s
      local.set 19
      local.get 10
      f32.convert_i32_s
      local.set 20
      local.get 9
      f32.convert_i32_s
      local.set 21
      loop  ;; label = @2
        block  ;; label = @3
          block  ;; label = @4
            local.get 14
            i32.const -28
            i32.add
            f32.load
            local.tee 15
            local.get 4
            f32.mul
            local.get 14
            i32.const -20
            i32.add
            f32.load
            local.tee 22
            local.get 3
            f32.mul
            f32.sub
            local.tee 23
            local.get 6
            f32.mul
            local.get 14
            i32.const -16
            i32.add
            f32.load
            local.tee 24
            local.get 5
            f32.mul
            f32.sub
            local.get 15
            local.get 3
            f32.mul
            local.get 22
            local.get 4
            f32.mul
            f32.add
            f32.const 0x1.4p+1 (;=2.5;)
            f32.add
            local.tee 15
            f32.div
            local.get 21
            f32.mul
            local.get 19
            f32.add
            local.tee 22
            f32.abs
            f32.const 0x1p+31 (;=2.14748e+09;)
            f32.lt
            i32.eqz
            br_if 0 (;@4;)
            local.get 22
            i32.trunc_f32_s
            local.set 13
            br 1 (;@3;)
          end
          i32.const -2147483648
          local.set 13
        end
        local.get 13
        i32.const 0
        i32.lt_s
        local.set 17
        block  ;; label = @3
          block  ;; label = @4
            local.get 14
            i32.const -24
            i32.add
            f32.load
            local.get 8
            f32.mul
            local.get 24
            local.get 6
            f32.mul
            local.get 23
            local.get 5
            f32.mul
            f32.add
            local.get 7
            f32.mul
            f32.sub
            local.get 15
            f32.div
            local.get 20
            f32.mul
            local.get 18
            f32.add
            local.tee 15
            f32.abs
            f32.const 0x1p+31 (;=2.14748e+09;)
            f32.lt
            i32.eqz
            br_if 0 (;@4;)
            local.get 15
            i32.trunc_f32_s
            local.set 16
            br 1 (;@3;)
          end
          i32.const -2147483648
          local.set 16
        end
        block  ;; label = @3
          local.get 17
          br_if 0 (;@3;)
          local.get 16
          local.get 10
          i32.ge_s
          br_if 0 (;@3;)
          local.get 13
          local.get 9
          i32.ge_s
          br_if 0 (;@3;)
          local.get 16
          i32.const 0
          i32.lt_s
          br_if 0 (;@3;)
          block  ;; label = @4
            block  ;; label = @5
              local.get 14
              i32.const -8
              i32.add
              f32.load
              f32.const 0x1.fep+7 (;=255;)
              f32.mul
              local.tee 15
              f32.const 0x1p+32 (;=4.29497e+09;)
              f32.lt
              local.get 15
              f32.const 0x0p+0 (;=0;)
              f32.ge
              i32.and
              i32.eqz
              br_if 0 (;@5;)
              local.get 15
              i32.trunc_f32_u
              local.set 17
              br 1 (;@4;)
            end
            i32.const 0
            local.set 17
          end
          local.get 17
          i32.const 8
          i32.shl
          local.set 17
          block  ;; label = @4
            block  ;; label = @5
              local.get 14
              i32.const -12
              i32.add
              f32.load
              f32.const 0x1.fep+7 (;=255;)
              f32.mul
              local.tee 15
              f32.const 0x1p+32 (;=4.29497e+09;)
              f32.lt
              local.get 15
              f32.const 0x0p+0 (;=0;)
              f32.ge
              i32.and
              i32.eqz
              br_if 0 (;@5;)
              local.get 15
              i32.trunc_f32_u
              local.set 12
              br 1 (;@4;)
            end
            i32.const 0
            local.set 12
          end
          local.get 17
          local.get 12
          i32.or
          local.set 17
          block  ;; label = @4
            block  ;; label = @5
              local.get 14
              i32.const -4
              i32.add
              f32.load
              f32.const 0x1.fep+7 (;=255;)
              f32.mul
              local.tee 15
              f32.const 0x1p+32 (;=4.29497e+09;)
              f32.lt
              local.get 15
              f32.const 0x0p+0 (;=0;)
              f32.ge
              i32.and
              i32.eqz
              br_if 0 (;@5;)
              local.get 15
              i32.trunc_f32_u
              local.set 12
              br 1 (;@4;)
            end
            i32.const 0
            local.set 12
          end
          local.get 17
          local.get 12
          i32.const 16
          i32.shl
          i32.or
          local.set 17
          block  ;; label = @4
            block  ;; label = @5
              local.get 14
              f32.load
              f32.const 0x1.fep+7 (;=255;)
              f32.mul
              local.tee 15
              f32.const 0x1p+32 (;=4.29497e+09;)
              f32.lt
              local.get 15
              f32.const 0x0p+0 (;=0;)
              f32.ge
              i32.and
              i32.eqz
              br_if 0 (;@5;)
              local.get 15
              i32.trunc_f32_u
              local.set 12
              br 1 (;@4;)
            end
            i32.const 0
            local.set 12
          end
          local.get 11
          local.get 16
          local.get 9
          i32.mul
          local.get 13
          i32.add
          i32.const 2
          i32.shl
          i32.add
          local.get 17
          local.get 12
          i32.const 24
          i32.shl
          i32.or
          i32.store
        end
        local.get 14
        i32.const 32
        i32.add
        local.set 14
        local.get 1
        i32.const -1
        i32.add
        local.tee 1
        br_if 0 (;@2;)
      end
    end)
  (table (;0;) 1 1 funcref)
  (memory (;0;) 2)
  (global (;0;) (mut i32) (i32.const 66560))
  (global (;1;) i32 (i32.const 1024))
  (global (;2;) i32 (i32.const 1024))
  (global (;3;) i32 (i32.const 1024))
  (global (;4;) i32 (i32.const 66560))
  (global (;5;) i32 (i32.const 0))
  (global (;6;) i32 (i32.const 1))
  (export "memory" (memory 0))
  (export "__wasm_call_ctors" (func $__wasm_call_ctors))
  (export "colorToUint32" (func $colorToUint32))
  (export "frame" (func $frame))
  (export "__dso_handle" (global 1))
  (export "__data_end" (global 2))
  (export "__global_base" (global 3))
  (export "__heap_base" (global 4))
  (export "__memory_base" (global 5))
  (export "__table_base" (global 6)))
