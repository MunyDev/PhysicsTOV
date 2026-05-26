import math

import scipy.integrate
import sympy
from math import pi
import matplotlib.pyplot as plt
k = 1.46e-2          # polytrope constant
gamma = 2.0
rho_c = 2
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
    dr = 2
    P_c = k * pow(rho_c, gamma)
    P = P_c
    m = (4/3) * pi * pow(r, 3) * rho_c
    while r < R:
        m += dm_of_dr(P, r) * dr

        P+=dr*model(P, r, m)
        
        if (P < threshold):
            break
        r+=dr
    return r/1000, m/M
Rs, Ms = [], []
for i in range(50):
    rho_c = 1e17 * 10 ** (i * 2.3 / 49)
    R, Ma = nw_model(rho_c)
    Rs.append(R)
    Ms.append(Ma)
plt.figure(figsize=(7, 5))
plt.plot(Rs, Ms, color='#1D9E75', lw=2, label='our EOS (Γ=2 polytrope)')
plt.scatter([14.67], [1.58], color='#D85A30', s=60, zorder=5,
            label='reference star (the M(r) plot)')
plt.errorbar(12.92, 2.08, xerr=[[1.13], [2.09]], yerr=0.07, fmt='o',
             color='orange', capsize=4, label='PSR J0740+6620')
plt.errorbar(13.02, 1.44, xerr=[[1.06], [1.24]], yerr=[[0.14], [0.15]], fmt='o',
             color='green', capsize=4, label='PSR J0030+0451')
plt.xlabel('Radius R (km)')
plt.ylabel('Mass M (solar masses)')
plt.title('Mass-Radius relation (each point = one star)')
plt.grid(alpha=0.3)
plt.legend()
plt.tight_layout()
plt.savefig("mass_radius.png", dpi=300)