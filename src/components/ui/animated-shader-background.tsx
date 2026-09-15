import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const AnoAI = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // ------------------------------------------------------------
    // MOBILE
    // ------------------------------------------------------------
    // Keep the existing behavior of disabling the heavy WebGL
    // animation on small screens.
    if (window.innerWidth < 768) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    // ------------------------------------------------------------
    // SCENE
    // ------------------------------------------------------------

    const scene = new THREE.Scene();

    // Full-screen orthographic camera
    const camera = new THREE.OrthographicCamera(
      -1,
      1,
      1,
      -1,
      0,
      1
    );

    // ------------------------------------------------------------
    // RENDERER
    // ------------------------------------------------------------

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    // Limit pixel ratio for performance
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.5)
    );

    // IMPORTANT:
    // Always use the COMPLETE viewport size.
    renderer.setSize(
      window.innerWidth,
      window.innerHeight,
      false
    );

    // Prevent the canvas from behaving like an inline image
    renderer.domElement.style.display = "block";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    container.appendChild(renderer.domElement);

    // ------------------------------------------------------------
    // SHADER MATERIAL
    // ------------------------------------------------------------

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: {
          value: 0,
        },

        iResolution: {
          value: new THREE.Vector2(
            window.innerWidth,
            window.innerHeight
          ),
        },
      },

      vertexShader: `
        void main() {
          gl_Position = vec4(position, 1.0);
        }
      `,

      fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;

        #define NUM_OCTAVES 3

        float rand(vec2 n) {
          return fract(
            sin(
              dot(
                n,
                vec2(12.9898, 4.1414)
              )
            ) * 43758.5453
          );
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);

          u = u * u * (3.0 - 2.0 * u);

          float res = mix(
            mix(
              rand(ip),
              rand(ip + vec2(1.0, 0.0)),
              u.x
            ),
            mix(
              rand(ip + vec2(0.0, 1.0)),
              rand(ip + vec2(1.0, 1.0)),
              u.x
            ),
            u.y
          );

          return res * res;
        }

        float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.3;

          vec2 shift = vec2(100.0);

          mat2 rot = mat2(
            cos(0.5),
            sin(0.5),
            -sin(0.5),
            cos(0.5)
          );

          for (int i = 0; i < NUM_OCTAVES; ++i) {
            v += a * noise(x);

            x = rot * x * 2.0 + shift;

            a *= 0.4;
          }

          return v;
        }

        void main() {

          // ------------------------------------------------------
          // ANIMATION SHAKE
          // ------------------------------------------------------

          vec2 shake = vec2(
            sin(iTime * 1.2) * 0.005,
            cos(iTime * 2.1) * 0.005
          );

          // ------------------------------------------------------
          // SCREEN COORDINATES
          // ------------------------------------------------------

          vec2 p =
            (
              (gl_FragCoord.xy + shake * iResolution.xy)
              - iResolution.xy * 0.5
            )
            / iResolution.y
            * mat2(
              6.0,
              -4.0,
              4.0,
              6.0
            );

          vec2 v;

          vec4 o = vec4(0.0);

          // ------------------------------------------------------
          // FLOW FIELD
          // ------------------------------------------------------

          float f =
            2.0
            + fbm(
                p + vec2(
                  iTime * 5.0,
                  0.0
                )
              ) * 0.5;

          // ------------------------------------------------------
          // AURORA LINES
          // ------------------------------------------------------

          for (float i = 0.0; i < 35.0; i++) {

            v =
              p
              + cos(
                  i * i
                  + (
                      iTime
                      + p.x * 0.08
                    ) * 0.025
                  + i * vec2(13.0, 11.0)
                ) * 3.5

              + vec2(
                  sin(iTime * 3.0 + i) * 0.003,
                  cos(iTime * 3.5 - i) * 0.003
                );

            float tailNoise =
              fbm(
                v + vec2(
                  iTime * 0.5,
                  i
                )
              )
              * 0.3
              * (
                1.0
                - (i / 35.0)
              );

            // ----------------------------------------------------
            // AURORA COLORS
            // ----------------------------------------------------

            vec4 auroraColors = vec4(
              0.1
                + 0.3
                * sin(
                    i * 0.2
                    + iTime * 0.4
                  ),

              0.3
                + 0.5
                * cos(
                    i * 0.3
                    + iTime * 0.5
                  ),

              0.7
                + 0.3
                * sin(
                    i * 0.4
                    + iTime * 0.3
                  ),

              1.0
            );

            // ----------------------------------------------------
            // LIGHT CONTRIBUTION
            // ----------------------------------------------------

            vec4 currentContribution =
              auroraColors
              * exp(
                  sin(
                    i * i
                    + iTime * 0.8
                  )
                )
              / length(
                  max(
                    v,
                    vec2(
                      v.x * f * 0.015,
                      v.y * 1.5
                    )
                  )
                );

            float thinnessFactor =
              smoothstep(
                0.0,
                1.0,
                i / 35.0
              )
              * 0.6;

            o +=
              currentContribution
              * (
                  1.0
                  + tailNoise * 0.8
                )
              * thinnessFactor;
          }

          // ------------------------------------------------------
          // FINAL COLOR
          // ------------------------------------------------------

          o =
            tanh(
              pow(
                o / 100.0,
                vec4(1.6)
              )
            );

          gl_FragColor = o * 1.5;
        }
      `,
    });

    // ------------------------------------------------------------
    // FULL-SCREEN PLANE
    // ------------------------------------------------------------

    const geometry = new THREE.PlaneGeometry(
      2,
      2
    );

    const mesh = new THREE.Mesh(
      geometry,
      material
    );

    scene.add(mesh);

    // ------------------------------------------------------------
    // ANIMATION
    // ------------------------------------------------------------

    let frameId = 0;

    let lastTime = 0;

    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);

      // Approximately 60 FPS
      if (time - lastTime < 16) {
        return;
      }

      lastTime = time;

      material.uniforms.iTime.value += 0.016;

      renderer.render(
        scene,
        camera
      );
    };

    // Initial render
    renderer.render(
      scene,
      camera
    );

    frameId = requestAnimationFrame(
      animate
    );

    // ------------------------------------------------------------
    // RESPONSIVE RESIZE
    // ------------------------------------------------------------

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // IMPORTANT:
      // Always resize to the complete viewport.
      renderer.setSize(
        width,
        height,
        false
      );

      material.uniforms.iResolution.value.set(
        width,
        height
      );

      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    // ------------------------------------------------------------
    // CLEANUP
    // ------------------------------------------------------------

    return () => {
      cancelAnimationFrame(frameId);

      window.removeEventListener(
        "resize",
        handleResize
      );

      if (
        container.contains(
          renderer.domElement
        )
      ) {
        container.removeChild(
          renderer.domElement
        );
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // --------------------------------------------------------------
  // BACKGROUND CONTAINER
  // --------------------------------------------------------------

  return (
    <div
      ref={containerRef}
      className="
        fixed
        inset-0
        w-full
        h-full
        overflow-hidden
        pointer-events-none
        -z-10
      "
      style={{
        width: "100vw",
        height: "100vh",
        maxWidth: "100%",
      }}
    />
  );
};

export default AnoAI;