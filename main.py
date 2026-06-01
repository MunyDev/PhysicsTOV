import math
import os
import hashlib

import scipy.integrate
import sympy
from math import pi
import matplotlib.pyplot as plt
from flask import Flask, send_from_directory, request, jsonify
import json
app = Flask(__name__)
CACHE_DIR = 'cache'
os.makedirs(CACHE_DIR, exist_ok=True)
@app.route('/model')
def handle_model_request():
    k = float(request.args.get('k', 1.46e-2))          # polytrope constant
    gamma = float(request.args.get('gamma', 2.0))
    rho_c = float(request.args.get('rho_c', 1e17))
    dr = float(request.args.get('dr', 2))
    M = 1.989e30
    G = 6.674e-11
    c = 299792458
    def schwarzschild_radius(r):
        return (2 * G * M) / (r * c**2)
    def rho_mass_of_r(P, r): 
        return pow(P/k, (1/gamma))

    def dm_of_dr(P, r):
        # return 4 * pi * r**2 * rho_mass * (1 - (1 / math.sqrt(1 - schwarzschild_radius(r))))
        return 4 * pi * r*r*rho_mass_of_r(P, r)

    def model(P, r, mass):
        rho = pow((P/k), (1/gamma))
        p1 = -(G * mass * rho)/(r*r)
        p2 = (1 + (P/(rho*c*c)))
        p3=(1+((4*pi*(r**3)*P)/(mass*c**2)))
        p4_inv = (1 - ((2*G*mass)/(r*c**2)))
        p4 = 1/p4_inv
        return p1*p2*p3*p4
    threshold = 0.0000001
    def nw_model(rho_c, R=100000):
        r = 0.000001
        P_for_r = {}
        P_c = k * pow(rho_c, gamma)
        P = P_c
        m = (4/3) * pi * pow(r, 3) * rho_c
        while r < R:
            m += dm_of_dr(P, r) * dr

            P+=dr*model(P, r, m)
            P_for_r[r] = P
            if (P < threshold):
                break
            r+=dr
        return r/1000, m/M, P_for_r

    cache_key = hashlib.sha1(f"k={k}_gamma={gamma}_rho_c={rho_c}_dr={dr}".encode('utf-8')).hexdigest()
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            cached = json.load(f)
        return jsonify(cached)

    R, Ma, P_for_r = nw_model(rho_c)
    output = {
        'k': k,
        'gamma': gamma,
        'rho_c': rho_c,
        'dr': dr,
        'R_km': R,
        'M_solar': Ma,
        'P_for_r': P_for_r,
    }
    try:
        with open(cache_file, 'w') as f:
            json.dump(output, f)
    except Exception:
        pass
    return jsonify(output)
@app.route('/<path:path>')
def send_static(path):
    # This will check your static folder for any file requested at the root
    return send_from_directory('.', path)
app.run('0.0.0.0',port=8087)