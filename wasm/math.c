#define PI 3.14159265358979

void frame(
	int time,
	int numRectangles,
	float *x,
	float *y,
	float *z,
	float *w,
	unsigned int *color, // R, G, B, A as separate bytes

	float sinXzAngle,
	float cosXzAngle,
	float sinXwAngle,
	float cosXwAngle,
	float sinYwAngle,
	float cosYwAngle,

	int width,
	int height,
	unsigned int *frame
) {
	float timeSeconds = time / 1000.0f;

	unsigned char *frameBytes = (unsigned char*)frame;
	int bytes = width * height * 4;
	float darkenFactor = 0.8;
	for (int i=0; i<bytes; i+=4) {
		frameBytes[i] = (unsigned char)(frameBytes[i] * darkenFactor);
		frameBytes[i+1] = (unsigned char)(frameBytes[i+1] * darkenFactor);
		frameBytes[i+2] = (unsigned char)(frameBytes[i+2] * darkenFactor);
		// frameBytes[i+3] = (unsigned char)(frameBytes[i+3] * 0.9);
	}

	for (int i=0; i < numRectangles; i++) {
		float aX = x[i];
		float aY = y[i];
		float aZ = z[i];
		float aW = w[i];

		float tx = aX * cosXzAngle - aZ * sinXzAngle;
		float ty = aY;
		float tz = aX * sinXzAngle + aZ * cosXzAngle;
		float tw = aW;

		// XW rotation
		float t = tx * cosXwAngle - tw * sinXwAngle;
		ty = ty;
		tz = tz;
		tw = tx * sinXwAngle + tw * cosXwAngle;
		tx = t;

		// YW rotation
		tx = tx;
		t =  ty * cosYwAngle - tw * sinYwAngle;
		tz = tz;
		tw = ty * sinYwAngle + tw * cosYwAngle;
		ty = t;

		float zz = tz + 2.5f;
		int xs = (int)(tx / zz * width + width/2);
		int ys = (int)(ty / zz * height + height/2);

		if (xs >= 0 && xs < width && ys >= 0 && ys < height) {
			frame[ys * width + xs] = color[i];
			frame[ys * width + xs + 1] = color[i];
			frame[(ys + 1) * width + xs] = color[i];
			frame[(ys + 1) * width + xs + 1] = color[i];
		}
	}
}