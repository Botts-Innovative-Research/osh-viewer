import * as Cesium from 'cesium';

/**
 * Renders a camera frustum on a Cesium scene as a wireframe outline + translucent fill.
 *
 * Cesium primitives are immutable once tessellated, so update() tears down the previous
 * pair of Primitives and rebuilds them.  Call destroy() to remove and release everything.
 */
export class FrustumPrimitive {
    /**
     * @param {Cesium.Viewer} viewer
     * @param {object} [options]
     * @param {number} [options.hfov=60]          Horizontal field-of-view, degrees
     * @param {number} [options.vfov=45]           Vertical field-of-view, degrees
     * @param {number} [options.near=1]            Near-plane distance, metres
     * @param {number} [options.far=500]           Far-plane distance, metres
     * @param {Cesium.Color} [options.color]       Fill colour (should be translucent)
     * @param {Cesium.Color} [options.outlineColor] Wireframe colour
     */
    constructor(viewer, options = {}) {
        this._viewer = viewer;
        this._hfov = options.hfov ?? 60;
        this._vfov = options.vfov ?? 45;
        this._near = options.near ?? 1;
        this._far = options.far ?? 500;
        this._color = options.color ?? Cesium.Color.CYAN.withAlpha(0.12);
        this._outlineColor = options.outlineColor ?? Cesium.Color.CYAN;
        this._negatePitch = options.negatePitch ?? false;
        this._negateRoll = options.negateRoll ?? false;
        this._fillPrimitive = null;
        this._outlinePrimitive = null;
    }

    /**
     * Place or move the frustum.
     *
     * @param {number} lon         Longitude, degrees
     * @param {number} lat         Latitude, degrees
     * @param {number} alt         Altitude above ellipsoid, metres
     * @param {number} headingDeg  Camera yaw, degrees (0 = North, clockwise)
     * @param {number} [pitchDeg=0]   Camera pitch, degrees (negative = down)
     * @param {number} [rollDeg=0]    Camera roll, degrees
     */
    update(lon, lat, alt, headingDeg, pitchDeg = 0, rollDeg = 0) {
        this._removePrimitives();

        const origin = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
        const p = this._negatePitch ? -pitchDeg : pitchDeg;
        const r = this._negateRoll ? -rollDeg : rollDeg;
        const hpr = new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(headingDeg),
            Cesium.Math.toRadians(p),
            Cesium.Math.toRadians(r),
        );
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(origin, hpr);

        const vFovRad = Cesium.Math.toRadians(this._vfov);
        const aspectRatio =
            Math.tan(Cesium.Math.toRadians(this._hfov / 2)) / Math.tan(vFovRad / 2);

        const frustum = new Cesium.PerspectiveFrustum({
            fov: vFovRad,
            aspectRatio,
            near: this._near,
            far: this._far,
        });

        // --- fill ---
        this._fillPrimitive = this._viewer.scene.primitives.add(
            new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: new Cesium.FrustumGeometry({
                        frustum,
                        origin,
                        orientation,
                        vertexFormat: Cesium.VertexFormat.POSITION_ONLY,
                    }),
                }),
                appearance: new Cesium.MaterialAppearance({
                    material: Cesium.Material.fromType('Color', { color: this._color }),
                    flat: true,
                    translucent: true,
                }),
                asynchronous: false,
            }),
        );

        // --- wireframe outline ---
        this._outlinePrimitive = this._viewer.scene.primitives.add(
            new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: new Cesium.FrustumOutlineGeometry({
                        frustum,
                        origin,
                        orientation,
                    }),
                    attributes: {
                        color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                            this._outlineColor,
                        ),
                    },
                }),
                appearance: new Cesium.PerInstanceColorAppearance({
                    flat: true,
                    translucent: false,
                }),
                asynchronous: false,
            }),
        );
    }

    _removePrimitives() {
        if (this._fillPrimitive && !this._fillPrimitive.isDestroyed()) {
            this._viewer.scene.primitives.remove(this._fillPrimitive);
        }
        this._fillPrimitive = null;

        if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed()) {
            this._viewer.scene.primitives.remove(this._outlinePrimitive);
        }
        this._outlinePrimitive = null;
    }

    destroy() {
        if (this._viewer) {
            this._removePrimitives();
            this._viewer = null;
        }
    }
}
