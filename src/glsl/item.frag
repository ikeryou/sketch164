uniform vec3 color;
uniform vec3 addCol;
uniform float alpha;
uniform float addColRate;

void main(void) {
  vec4 dest = vec4(color, alpha);
  dest.rgb += mix(vec3(0.0), addCol, addColRate);
  gl_FragColor = dest;
}
