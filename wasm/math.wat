(module
  (type (;0;) (func))
  (type (;1;) (func (param i32 i32 i32 i32 i32 i32 i32 f32 f32 f32 f32 f32 f32 i32 i32 i32)))
  (func $__wasm_call_ctors (type 0))
  (func $frame (type 1) (param i32 i32 i32 i32 i32 i32 i32 f32 f32 f32 f32 f32 f32 i32 i32 i32)
    (local i32 i32 i32 f32 i32 i32 f32 f32 f32 f32 f32 f32 f32)
    block  ;; label = @1
      local.get 13
      local.get 14
      i32.mul
      i32.const 2
      i32.shl
      local.tee 16
      i32.const 1
      i32.lt_s
      br_if 0 (;@1;)
      i32.const 0
      local.set 17
      loop  ;; label = @2
        block  ;; label = @3
          block  ;; label = @4
            local.get 15
            local.get 17
            i32.add
            local.tee 18
            i32.load8_u
            f32.convert_i32_u
            f32.const 0x1.99999ap-1 (;=0.8;)
            f32.mul
            local.tee 19
            f32.const 0x1p+32 (;=4.29497e+09;)
            f32.lt
            local.get 19
            f32.const 0x0p+0 (;=0;)
            f32.ge
            i32.and
            i32.eqz
            br_if 0 (;@4;)
            local.get 19
            i32.trunc_f32_u
            local.set 20
            br 1 (;@3;)
          end
          i32.const 0
          local.set 20
        end
        local.get 18
        local.get 20
        i32.store8
        block  ;; label = @3
          block  ;; label = @4
            local.get 18
            i32.const 1
            i32.add
            local.tee 20
            i32.load8_u
            f32.convert_i32_u
            f32.const 0x1.99999ap-1 (;=0.8;)
            f32.mul
            local.tee 19
            f32.const 0x1p+32 (;=4.29497e+09;)
            f32.lt
            local.get 19
            f32.const 0x0p+0 (;=0;)
            f32.ge
            i32.and
            i32.eqz
            br_if 0 (;@4;)
            local.get 19
            i32.trunc_f32_u
            local.set 21
            br 1 (;@3;)
          end
          i32.const 0
          local.set 21
        end
        local.get 20
        local.get 21
        i32.store8
        block  ;; label = @3
          block  ;; label = @4
            local.get 18
            i32.const 2
            i32.add
            local.tee 18
            i32.load8_u
            f32.convert_i32_u
            f32.const 0x1.99999ap-1 (;=0.8;)
            f32.mul
            local.tee 19
            f32.const 0x1p+32 (;=4.29497e+09;)
            f32.lt
            local.get 19
            f32.const 0x0p+0 (;=0;)
            f32.ge
            i32.and
            i32.eqz
            br_if 0 (;@4;)
            local.get 19
            i32.trunc_f32_u
            local.set 20
            br 1 (;@3;)
          end
          i32.const 0
          local.set 20
        end
        local.get 18
        local.get 20
        i32.store8
        local.get 17
        i32.const 4
        i32.add
        local.tee 17
        local.get 16
        i32.lt_s
        br_if 0 (;@2;)
      end
    end
    block  ;; label = @1
      local.get 1
      i32.const 1
      i32.lt_s
      br_if 0 (;@1;)
      local.get 14
      i32.const 2
      i32.div_s
      f32.convert_i32_s
      local.set 22
      local.get 13
      i32.const 2
      i32.div_s
      f32.convert_i32_s
      local.set 23
      local.get 14
      f32.convert_i32_s
      local.set 24
      local.get 13
      f32.convert_i32_s
      local.set 25
      loop  ;; label = @2
        block  ;; label = @3
          block  ;; label = @4
            local.get 2
            f32.load
            local.tee 19
            local.get 8
            f32.mul
            local.get 4
            f32.load
            local.tee 26
            local.get 7
            f32.mul
            f32.sub
            local.tee 27
            local.get 10
            f32.mul
            local.get 5
            f32.load
            local.tee 28
            local.get 9
            f32.mul
            f32.sub
            local.get 19
            local.get 7
            f32.mul
            local.get 26
            local.get 8
            f32.mul
            f32.add
            f32.const 0x1.4p+1 (;=2.5;)
            f32.add
            local.tee 19
            f32.div
            local.get 25
            f32.mul
            local.get 23
            f32.add
            local.tee 26
            f32.abs
            f32.const 0x1p+31 (;=2.14748e+09;)
            f32.lt
            i32.eqz
            br_if 0 (;@4;)
            local.get 26
            i32.trunc_f32_s
            local.set 18
            br 1 (;@3;)
          end
          i32.const -2147483648
          local.set 18
        end
        local.get 18
        i32.const 0
        i32.lt_s
        local.set 20
        block  ;; label = @3
          block  ;; label = @4
            local.get 3
            f32.load
            local.get 12
            f32.mul
            local.get 28
            local.get 10
            f32.mul
            local.get 27
            local.get 9
            f32.mul
            f32.add
            local.get 11
            f32.mul
            f32.sub
            local.get 19
            f32.div
            local.get 24
            f32.mul
            local.get 22
            f32.add
            local.tee 19
            f32.abs
            f32.const 0x1p+31 (;=2.14748e+09;)
            f32.lt
            i32.eqz
            br_if 0 (;@4;)
            local.get 19
            i32.trunc_f32_s
            local.set 17
            br 1 (;@3;)
          end
          i32.const -2147483648
          local.set 17
        end
        block  ;; label = @3
          local.get 20
          br_if 0 (;@3;)
          local.get 17
          local.get 14
          i32.ge_s
          br_if 0 (;@3;)
          local.get 18
          local.get 13
          i32.ge_s
          br_if 0 (;@3;)
          local.get 17
          i32.const 0
          i32.lt_s
          br_if 0 (;@3;)
          local.get 15
          local.get 17
          local.get 13
          i32.mul
          local.get 18
          i32.add
          i32.const 2
          i32.shl
          i32.add
          local.tee 20
          local.get 6
          i32.load
          i32.store
          local.get 20
          i32.const 4
          i32.add
          local.get 6
          i32.load
          i32.store
          local.get 15
          local.get 17
          i32.const 1
          i32.add
          local.get 13
          i32.mul
          local.get 18
          i32.add
          i32.const 2
          i32.shl
          i32.add
          local.tee 18
          local.get 6
          i32.load
          i32.store
          local.get 18
          i32.const 4
          i32.add
          local.get 6
          i32.load
          i32.store
        end
        local.get 2
        i32.const 4
        i32.add
        local.set 2
        local.get 3
        i32.const 4
        i32.add
        local.set 3
        local.get 4
        i32.const 4
        i32.add
        local.set 4
        local.get 5
        i32.const 4
        i32.add
        local.set 5
        local.get 6
        i32.const 4
        i32.add
        local.set 6
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
  (export "frame" (func $frame))
  (export "__dso_handle" (global 1))
  (export "__data_end" (global 2))
  (export "__global_base" (global 3))
  (export "__heap_base" (global 4))
  (export "__memory_base" (global 5))
  (export "__table_base" (global 6)))
