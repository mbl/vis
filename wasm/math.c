#define PI 3.14159265358979

unsigned int colorToUint32(float * components) {
	unsigned char r = (unsigned char)(components[0] * 255);
	unsigned char g = (unsigned char)(components[1] * 255);
	unsigned char b = (unsigned char)(components[2] * 255);
	unsigned char a = (unsigned char)(components[3] * 255);

	// Little endian
	return r | g << 8 | b << 16 | a << 24;
}

void frame(
	int time,
	int numRectangles,
	float *data,  // X, Y, Z, W, R, G, B, A as separate bytes
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
		frameBytes[i+3] = 0xff;
	}

	for (int i=0; i < numRectangles; i++) {
		int i8 = i * 8;
		float aX = data[i8 + 0];
		float aY = data[i8 + 1];
		float aZ = data[i8 + 2];
		float aW = data[i8 + 3];

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
			int color = colorToUint32(data + i8 + 4);
			frame[ys * width + xs] = color;
			// frame[ys * width + xs + 1] = color;
			// frame[(ys + 1) * width + xs] = color;
			// frame[(ys + 1) * width + xs + 1] = color;
		}
	}
}